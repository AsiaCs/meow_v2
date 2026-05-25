import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { scrapeLuma } from "@/lib/scrapers/luma"
import { scrapeCerebralValley, type ScrapedEvent } from "@/lib/scrapers/cerebralvalley"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"
import { renderDigestHtml, renderDigestText, type DigestEvent } from "@/lib/email/digest-template"
import { sendEmail } from "@/lib/email/send"
import { signUserId } from "@/lib/email/token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 min — generous for ~hundreds of users

// Vercel cron is authorized with a Bearer token equal to CRON_SECRET.
// See https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
function isAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false // explicit env var required, no silent open path
  const got = req.headers.get("authorization")
  return got === `Bearer ${expected}`
}

interface SubscriberRow {
  id: string
  email: string | null
  name: string | null
  location: string | null
  interests: string[] | null
  digestEnabled: boolean | null
}

async function fetchSubscribers(): Promise<SubscriberRow[]> {
  // Service-role client so RLS doesn't block the cron. Falls back to anon if
  // the service-role key isn't set (works for small/dev datasets only).
  const supabaseUrl = SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
  const client = createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await client
    .from("users")
    .select("id, email, name, location, interests, digestEnabled")
    .eq("onboarded", true)
    .not("email", "is", null)

  if (error) {
    console.error("[cron/digest] fetchSubscribers", error)
    return []
  }
  // Treat NULL digestEnabled as opted-in (default behavior until users opt out).
  return (data ?? []).filter((u): u is SubscriberRow => u.digestEnabled !== false)
}

async function fetchCandidateEvents(): Promise<ScrapedEvent[]> {
  const [cv, lu] = await Promise.allSettled([
    scrapeCerebralValley(),
    scrapeLuma("networking tech startup"),
  ])
  const cvEvents = cv.status === "fulfilled" ? cv.value : []
  const luEvents = lu.status === "fulfilled" ? lu.value : []
  const specific = [...cvEvents, ...luEvents].filter((e) => isSpecificEventUrl(e.registrationUrl))
  return await filterReachable(specific, (e) => e.registrationUrl)
}

function relevantToUser(
  events: ScrapedEvent[],
  user: SubscriberRow,
  now: Date,
  weekEnd: Date,
): ScrapedEvent[] {
  const userCity = user.location?.split(",")[0]?.trim().toLowerCase() ?? null
  const userInterests = (user.interests ?? []).map((i) => i.toLowerCase())

  const upcoming = events.filter((e) => {
    const d = new Date(e.startDate)
    return d > now && d < weekEnd
  })

  function score(e: ScrapedEvent): number {
    let s = 0
    if (userCity && e.location?.toLowerCase().includes(userCity)) s += 10
    if (e.isVirtual && !userCity) s += 4
    const tagsLower = e.tags.map((t) => t.toLowerCase())
    for (const i of userInterests) {
      if (tagsLower.some((t) => t.includes(i) || i.includes(t))) s += 3
    }
    // Slightly favor earlier events in the window
    const hoursOut = (new Date(e.startDate).getTime() - now.getTime()) / 36e5
    s += Math.max(0, 7 - hoursOut / 24)
    return s
  }

  return upcoming
    .map((e) => ({ e, s: score(e) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map(({ e }) => e)
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL?.replace(/^https?:\/\//, "")?.replace(/^/, "https://") ??
    "https://meow-two-pied.vercel.app"
  )
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Validate that signing secret is set before doing any work
  if (!process.env.DIGEST_SECRET || process.env.DIGEST_SECRET.length < 16) {
    return NextResponse.json(
      { error: "DIGEST_SECRET env var missing or too short (16+ chars)" },
      { status: 500 },
    )
  }

  const startedAt = Date.now()
  const subs = await fetchSubscribers()
  if (subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "no subscribers" })
  }

  const candidates = await fetchCandidateEvents()
  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
  const base = appBaseUrl()

  let sent = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  for (const user of subs) {
    if (!user.email) {
      skipped++
      continue
    }

    const events = relevantToUser(candidates, user, now, weekEnd)
    if (events.length === 0) {
      skipped++
      continue
    }

    const digestEvents: DigestEvent[] = events.map((e) => ({
      title: e.title,
      startDate: new Date(e.startDate),
      location: e.location ?? null,
      isVirtual: e.isVirtual,
      registrationUrl: e.registrationUrl,
      imageUrl: e.imageUrl ?? null,
      tags: e.tags,
    }))

    const token = signUserId(user.id)
    const unsubUrl = `${base}/api/digest/unsubscribe?token=${encodeURIComponent(token)}`
    const webUrl = `${base}/events`
    const firstName = user.name?.split(" ")[0] ?? "there"
    const city = user.location?.split(",")[0]?.trim() ?? null

    const html = renderDigestHtml({ firstName, city, events: digestEvents, unsubUrl, webUrl })
    const text = renderDigestText({ firstName, city, events: digestEvents, unsubUrl, webUrl })
    const subject = city
      ? `${digestEvents.length} events in ${city} this week`
      : `${digestEvents.length} events for you this week`

    const result = await sendEmail({ to: user.email, subject, html, text })
    if (result.ok) {
      sent++
    } else if (result.skipped) {
      // Email provider not configured — abort the rest of the run.
      return NextResponse.json(
        { ok: false, error: result.error, sent, skipped, failed },
        { status: 503 },
      )
    } else {
      failed++
      errors.push(`${user.email}: ${result.error}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    failed,
    errors: errors.slice(0, 5),
    durationMs: Date.now() - startedAt,
  })
}

// Manual trigger for testing (same auth as GET).
export async function POST(req: Request) {
  return GET(req)
}
