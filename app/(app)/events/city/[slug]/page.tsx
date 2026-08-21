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

// Unmapped slugs used to be forwarded verbatim, so /events/city/san-francisco
// filtered for the literal string "san-francisco" and always rendered "No
// upcoming events in san-francisco" — even with 17 San Francisco events in the
// listing. Only the short aliases above ever worked. De-slugify instead, so
// the natural full-name URL matches the city labels lib/geo/parse.ts produces.
function deslugify(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) =>
      // "dc" -> "DC", "la" -> "LA": short all-consonant chunks are initialisms.
      word.length <= 2 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1),
    )
    .join(" ")
}

export default async function CityExplorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const city = CITY_LABEL[slug.toLowerCase()] ?? deslugify(slug)
  redirect(`/events?city=${encodeURIComponent(city)}`)
}
