import { NextResponse } from "next/server"
import { runAllScrapers } from "@/lib/scrapers"
import { limiters, clientIp, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const rl = await checkRateLimit(limiters.auth, `scraper:${clientIp(request)}`)
  if (!rl.ok) return tooManyRequests(rl.reset)

  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  if (!process.env.SCRAPER_SECRET || secret !== process.env.SCRAPER_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const result = await runAllScrapers()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[scraper/POST]", error)
    return NextResponse.json({ error: "Scraper failed" }, { status: 500 })
  }
}
