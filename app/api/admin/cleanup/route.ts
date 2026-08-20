import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isLinkReachable } from "@/lib/validators/links"
import { isSpecificApplyUrl, isSpecificEventUrl } from "@/lib/validators/specific-urls"
import { limiters, clientIp, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const maxDuration = 60

// Updated internship URLs: old applicationUrl -> new applicationUrl
const INTERNSHIP_URL_FIXES: Record<string, string> = {
  "https://boards.greenhouse.io/figma": "https://www.figma.com/careers/jobs/?team=design",
  "https://www.figma.com/careers/jobs/?team=design": "https://jobs.ashbyhq.com/figma?department=Internships",
  "https://boards.greenhouse.io/anthropic": "https://jobs.ashbyhq.com/anthropic?department=Internship",
  "https://boards.greenhouse.io/anthropic#internships": "https://jobs.ashbyhq.com/anthropic?department=Internship",
  "https://boards.greenhouse.io/notion": "https://www.notion.com/careers?role=internship",
  "https://boards.greenhouse.io/notion#internships": "https://www.notion.com/careers?role=internship",
  "https://jobs.lever.co/cohere": "https://jobs.lever.co/cohere?commitment=Intern",
  "https://jobs.lever.co/linear": "https://jobs.ashbyhq.com/linear",
  "https://jobs.a16z.com": "https://jobs.a16z.com/jobs?categories=Internship",
  "https://a16z.com/jobs/": "https://jobs.a16z.com/jobs?categories=Internship",
  "https://vercel.com/careers": "https://vercel.com/careers#open-positions",
  "https://jobs.lever.co/ramp": "https://jobs.lever.co/ramp?commitment=Intern",
  "https://jobs.lever.co/cohere?commitment=Intern": "https://jobs.ashbyhq.com/anthropic?department=Internship",
  "https://jobs.ashbyhq.com/linear": "https://jobs.ashbyhq.com/perplexity?department=University",
  "https://vercel.com/careers#jobs": "https://vercel.com/careers?search=intern",
  "https://vercel.com/careers#open-positions": "https://vercel.com/careers?search=intern",
  "https://jobs.lever.co/ramp?commitment=Intern": "https://jobs.a16z.com/jobs?categories=Internship",
}

type LinkedInRow = {
  id: string
  linkedinUrl: string | null
}

type InternshipRow = {
  id: string
  applicationUrl: string
}

type EventRow = {
  id: string
  registrationUrl: string
  startDate: string | null
}

export async function POST(request: Request) {
  // Rate-limit by IP before even checking the secret, so this endpoint can't
  // be brute-forced quickly even if SCRAPER_SECRET is ever weak.
  const rl = await checkRateLimit(limiters.auth, `admin-cleanup:${clientIp(request)}`)
  if (!rl.ok) return tooManyRequests(rl.reset)

  // Require a secret param that matches SCRAPER_SECRET. Fail closed: if the
  // env var is unset we refuse the request rather than falling back to a
  // guessable default — this endpoint performs destructive deletes.
  const expected = process.env.SCRAPER_SECRET
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: "Server misconfigured: SCRAPER_SECRET is unset or too short (need 16+ chars)." },
      { status: 503 },
    )
  }
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const report: Record<string, unknown> = {}

  // 1. Clear fake LinkedIn URLs (not matching linkedin.com/in/*)
  const { data: usersWithLinkedIn } = await supabase
    .from("users")
    .select("id, linkedinUrl")
    .not("linkedinUrl", "is", null)

  let clearedLinkedIn = 0
  for (const user of (usersWithLinkedIn ?? []) as LinkedInRow[]) {
    const url = user.linkedinUrl ?? ""
    let valid = false
    try {
      const { hostname, pathname } = new URL(url)
      valid =
        (hostname === "linkedin.com" || hostname === "www.linkedin.com") &&
        pathname.startsWith("/in/") &&
        pathname.length > 5
    } catch { /* invalid URL */ }

    if (!valid) {
      await supabase.from("users").update({ linkedinUrl: null }).eq("id", user.id)
      clearedLinkedIn++
    }
  }
  report.clearedFakeLinkedIn = clearedLinkedIn

  // 2. Fix known bad internship URLs
  let fixedInternshipUrls = 0
  for (const [oldUrl, newUrl] of Object.entries(INTERNSHIP_URL_FIXES)) {
    const { error } = await supabase
      .from("internships")
      .update({ applicationUrl: newUrl, sourceUrl: newUrl })
      .eq("applicationUrl", oldUrl)
    if (!error) fixedInternshipUrls++
  }
  report.fixedInternshipUrls = fixedInternshipUrls

  // 3. Validate remaining internship URLs and delete unreachable ones
  const { data: internships } = await supabase
    .from("internships")
    .select("id, applicationUrl, company, title")

  let removedInternships = 0
  const internshipChecks = await Promise.allSettled(
    ((internships ?? []) as InternshipRow[]).map(async (i) => {
      const ok = isSpecificApplyUrl(i.applicationUrl) && await isLinkReachable(i.applicationUrl)
      if (!ok) {
        await supabase.from("internships").delete().eq("id", i.id)
        removedInternships++
      }
    })
  )
  report.internshipsChecked = internshipChecks.length
  report.removedDeadInternships = removedInternships

  // 4. Validate event registration URLs and delete past/unreachable ones
  const { data: events } = await supabase
    .from("events")
    .select("id, registrationUrl, startDate")

  let removedEvents = 0
  const now = new Date()
  for (const ev of (events ?? []) as EventRow[]) {
    const isPast = ev.startDate && new Date(ev.startDate) < now
    if (isPast) {
      await supabase.from("events").delete().eq("id", ev.id)
      removedEvents++
      continue
    }
    const ok = isSpecificEventUrl(ev.registrationUrl) && await isLinkReachable(ev.registrationUrl)
    if (!ok) {
      await supabase.from("events").delete().eq("id", ev.id)
      removedEvents++
    }
  }
  report.removedDeadOrPastEvents = removedEvents

  return NextResponse.json({ ok: true, report })
}
