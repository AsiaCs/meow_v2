import { redirect } from "next/navigation"

// City-specific landing pages (e.g. /events/city/sf) just redirect into the
// main /events page with the city pre-selected via query string. Keeps a
// single source of truth for the events list while supporting bookmarkable
// city URLs in the Cerebral-Valley pattern.
const CITY_LABEL: Record<string, string> = {
  sf: "San Francisco",
  nyc: "New York",
  la: "Los Angeles",
  boston: "Boston",
  chicago: "Chicago",
  seattle: "Seattle",
  austin: "Austin",
  miami: "Miami",
  london: "London",
  toronto: "Toronto",
  berlin: "Berlin",
  singapore: "Singapore",
}

export default async function CityExplorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const city = CITY_LABEL[slug.toLowerCase()] ?? slug
  redirect(`/events?city=${encodeURIComponent(city)}`)
}
