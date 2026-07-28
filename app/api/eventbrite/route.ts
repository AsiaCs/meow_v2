import { NextRequest, NextResponse } from "next/server"
import { limiters, clientIp, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(limiters.proxy, `eventbrite:${clientIp(request)}`)
  if (!rl.ok) return tooManyRequests(rl.reset)

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const radius = searchParams.get("radius") ?? "50"
  const q = searchParams.get("q") ?? "networking professional"

  const TOKEN = process.env.EVENTBRITE_TOKEN

  if (!TOKEN || !lat || !lng) {
    return NextResponse.json({ ok: false, results: [] })
  }

  try {
    const res = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/` +
        `?location.latitude=${lat}&location.longitude=${lng}` +
        `&location.within=${radius}mi` +
        `&q=${encodeURIComponent(q + " networking professional")}` +
        `&expand=venue,organizer,category`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    )
    if (!res.ok) throw new Error("Eventbrite error")
    const data = await res.json()
    return NextResponse.json({ ok: true, results: data.events ?? [] })
  } catch {
    return NextResponse.json({ ok: false, results: [] })
  }
}
