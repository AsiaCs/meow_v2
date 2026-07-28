import { NextRequest, NextResponse } from "next/server"
import { limiters, clientIp, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(limiters.proxy, `geocoding:${clientIp(request)}`)
  if (!rl.ok) return tooManyRequests(rl.reset)

  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  const KEY = process.env.GOOGLE_MAPS_API_KEY

  if (!KEY) {
    return NextResponse.json({ ok: false, result: null })
  }

  try {
    if (city) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${KEY}`
      )
      const data = await res.json()
      if (data.results?.[0]) {
        const { lat: rlat, lng: rlng } = data.results[0].geometry.location
        return NextResponse.json({ ok: true, result: { lat: rlat, lng: rlng, label: data.results[0].formatted_address } })
      }
    } else if (lat && lng) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_1&key=${KEY}`
      )
      const data = await res.json()
      if (data.results?.[0]) {
        return NextResponse.json({ ok: true, result: { label: data.results[0].formatted_address } })
      }
    }
    return NextResponse.json({ ok: false, result: null })
  } catch {
    return NextResponse.json({ ok: false, result: null })
  }
}
