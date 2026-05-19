import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const radius = searchParams.get("radius") ?? "50"
  const interests = searchParams.get("interests") ?? ""

  const APP_ID = process.env.ADZUNA_APP_ID
  const API_KEY = process.env.ADZUNA_API_KEY

  if (!APP_ID || !API_KEY || !lat || !lng) {
    return NextResponse.json({ ok: false, results: [] })
  }

  const terms = interests.split(",").filter(Boolean)
  const what = terms.length > 0 ? terms.join(" OR ") + " internship" : "internship"

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/us/search/1` +
        `?app_id=${APP_ID}&app_key=${API_KEY}` +
        `&where=${lat},${lng}&distance=${radius}` +
        `&what=${encodeURIComponent(what)}&results_per_page=20` +
        `&content-type=application/json`
    )
    if (!res.ok) throw new Error("Adzuna error")
    const data = await res.json()
    return NextResponse.json({ ok: true, results: data.results ?? [] })
  } catch {
    return NextResponse.json({ ok: false, results: [] })
  }
}
