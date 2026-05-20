import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isLinkReachable } from "@/lib/validators/links"

export const runtime = "nodejs"
export const maxDuration = 60

// Updated internship URLs: old applicationUrl -> new applicationUrl
const INTERNSHIP_URL_FIXES: Record<string, string> = {
  "https://boards.greenhouse.io/figma": "https://www.figma.com/careers/jobs/?team=design",
  "https://jobs.lever.co/cohere": "https://jobs.lever.co/cohere?commitment=Intern",
  "https://jobs.lever.co/linear": "https://jobs.ashbyhq.com/linear",
  "https://jobs.a16z.com": "https://a16z.com/jobs/",
  "https://vercel.com/careers": "https://vercel.com/careers#open-positions",
  "https://jobs.lever.co/ramp": "https://jobs.lever.co/ramp?commitment=Intern",
}

export async function POST(request: Request) {
  // Simple auth: require a secret param
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  if (secret !== (process.env.SCRAPER_SECRET ?? "meow-admin")) {
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
  for (const user of usersWithLinkedIn ?? []) {
    const url: string = (user as any).linkedinUrl
    let valid = false
    try {
      const { hostname, pathname } = new URL(url)
      valid =
        (hostname === "linkedin.com" || hostname === "www.linkedin.com") &&
        pathname.startsWith("/in/") &&
        pathname.length > 5
    } catch { /* invalid URL */ }

    if (!valid) {
      await supabase.from("users").update({ linkedinUrl: null }).eq("id", (user as any).id)
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
    (internships ?? []).map(async (i: any) => {
      const ok = await isLinkReachable(i.applicationUrl)
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
  for (const ev of events ?? []) {
    const isPast = ev.startDate && new Date(ev.startDate) < now
    if (isPast) {
      await supabase.from("events").delete().eq("id", ev.id)
      removedEvents++
      continue
    }
    const ok = await isLinkReachable((ev as any).registrationUrl)
    if (!ok) {
      await supabase.from("events").delete().eq("id", ev.id)
      removedEvents++
    }
  }
  report.removedDeadOrPastEvents = removedEvents

  return NextResponse.json({ ok: true, report })
}
