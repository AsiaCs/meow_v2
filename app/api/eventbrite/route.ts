import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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
