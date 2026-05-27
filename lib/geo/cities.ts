// Canonical city database. Each entry carries enough info to drive both the
// parser (which assigns a free-form location string to one of these cities)
// and the proximity engine (which needs lat/lng).
//
// CRITICAL INVARIANT: Bay Area aliases (Palo Alto, Mountain View, San Jose,
// Berkeley, Oakland) must NOT collide with Los Angeles aliases (Santa Monica,
// Pasadena, Venice). They are different regions in the same state. The
// parser orders the lookup by alias specificity so the longer Bay Area
// city names win over generic substrings.

export interface City {
  /** Display label shown on chips and "X near Y" UI */
  label: string
  /** Region group — events in the same region cluster together */
  region:
    | "Bay Area" | "Los Angeles" | "New York" | "Boston" | "Seattle"
    | "Austin" | "Chicago" | "Denver" | "Miami" | "Washington DC" | "Toronto"
    | "London" | "Paris" | "Berlin" | "Amsterdam" | "Lisbon"
    | "Singapore" | "Tokyo" | "Seoul" | "Bengaluru" | "Dubai" | "Sydney"
  state?: string                 // "CA", "NY", "MA" etc — null outside US
  country: string                // ISO-3166-1 alpha-2
  lat: number
  lng: number
  /** Substrings that match this city in a free-form location string.
   *  Order matters: PUT MORE SPECIFIC ALIASES FIRST inside each entry. */
  aliases: string[]
}

// Ordered from most specific to least. The parser scans entries top-to-bottom
// so Bay Area / SoCal disambiguation works by sheer ordering:
//   Palo Alto ("palo alto") matches BEFORE the generic "los angeles" / "la" entries.
export const CITIES: City[] = [
  // ---------- Bay Area (NorCal) — listed BEFORE anything containing "ca" ----------
  { label: "San Francisco", region: "Bay Area", state: "CA", country: "US", lat: 37.7749, lng: -122.4194,
    aliases: ["san francisco", "sf, ca", "sf,ca", "sf bay area", ", sf", " sf ", "soma", "downtown sf", "mission district"] },
  { label: "Palo Alto",     region: "Bay Area", state: "CA", country: "US", lat: 37.4419, lng: -122.1430,
    aliases: ["palo alto"] },
  { label: "Mountain View", region: "Bay Area", state: "CA", country: "US", lat: 37.3861, lng: -122.0839,
    aliases: ["mountain view"] },
  { label: "Menlo Park",    region: "Bay Area", state: "CA", country: "US", lat: 37.4530, lng: -122.1817,
    aliases: ["menlo park"] },
  { label: "Berkeley",      region: "Bay Area", state: "CA", country: "US", lat: 37.8716, lng: -122.2727,
    aliases: ["berkeley"] },
  { label: "Oakland",       region: "Bay Area", state: "CA", country: "US", lat: 37.8044, lng: -122.2712,
    aliases: ["oakland"] },
  { label: "San Jose",      region: "Bay Area", state: "CA", country: "US", lat: 37.3382, lng: -121.8863,
    aliases: ["san jose"] },
  { label: "Sunnyvale",     region: "Bay Area", state: "CA", country: "US", lat: 37.3688, lng: -122.0363,
    aliases: ["sunnyvale"] },
  { label: "Redwood City",  region: "Bay Area", state: "CA", country: "US", lat: 37.4852, lng: -122.2364,
    aliases: ["redwood city"] },
  { label: "Cupertino",     region: "Bay Area", state: "CA", country: "US", lat: 37.3230, lng: -122.0322,
    aliases: ["cupertino"] },
  // Anything that just says "Bay Area" gets bucketed to SF (region-level fallback)
  { label: "San Francisco", region: "Bay Area", state: "CA", country: "US", lat: 37.7749, lng: -122.4194,
    aliases: ["bay area"] },

  // ---------- Los Angeles (SoCal) — only matches SoCal-specific aliases ----------
  { label: "Los Angeles",   region: "Los Angeles", state: "CA", country: "US", lat: 34.0522, lng: -118.2437,
    aliases: ["los angeles", "downtown la", " la,", "la, ca"] },
  { label: "Santa Monica",  region: "Los Angeles", state: "CA", country: "US", lat: 34.0195, lng: -118.4912,
    aliases: ["santa monica"] },
  { label: "Venice",        region: "Los Angeles", state: "CA", country: "US", lat: 33.9850, lng: -118.4695,
    aliases: ["venice, ca", "venice beach"] },
  { label: "Pasadena",      region: "Los Angeles", state: "CA", country: "US", lat: 34.1478, lng: -118.1445,
    aliases: ["pasadena"] },
  { label: "Hollywood",     region: "Los Angeles", state: "CA", country: "US", lat: 34.0928, lng: -118.3287,
    aliases: ["hollywood"] },

  // ---------- New York ----------
  { label: "New York",      region: "New York", state: "NY", country: "US", lat: 40.7128, lng: -74.0060,
    aliases: ["new york city", "new york, ny", "nyc", "manhattan", "midtown", "soho", "tribeca", "chelsea, ny", "lower east side"] },
  { label: "Brooklyn",      region: "New York", state: "NY", country: "US", lat: 40.6782, lng: -73.9442,
    aliases: ["brooklyn"] },
  { label: "Queens",        region: "New York", state: "NY", country: "US", lat: 40.7282, lng: -73.7949,
    aliases: ["queens, ny", "long island city"] },

  // ---------- Boston ----------
  { label: "Boston",        region: "Boston", state: "MA", country: "US", lat: 42.3601, lng: -71.0589,
    aliases: ["boston"] },
  { label: "Cambridge",     region: "Boston", state: "MA", country: "US", lat: 42.3736, lng: -71.1097,
    aliases: ["cambridge, ma", "kendall square"] },
  { label: "Somerville",    region: "Boston", state: "MA", country: "US", lat: 42.3876, lng: -71.0995,
    aliases: ["somerville"] },

  // ---------- Seattle ----------
  { label: "Seattle",       region: "Seattle", state: "WA", country: "US", lat: 47.6062, lng: -122.3321,
    aliases: ["seattle"] },
  { label: "Bellevue",      region: "Seattle", state: "WA", country: "US", lat: 47.6101, lng: -122.2015,
    aliases: ["bellevue, wa"] },
  { label: "Redmond",       region: "Seattle", state: "WA", country: "US", lat: 47.6740, lng: -122.1215,
    aliases: ["redmond, wa"] },

  // ---------- Other US ----------
  { label: "Austin",        region: "Austin",     state: "TX", country: "US", lat: 30.2672, lng: -97.7431, aliases: ["austin"] },
  { label: "Chicago",       region: "Chicago",    state: "IL", country: "US", lat: 41.8781, lng: -87.6298, aliases: ["chicago"] },
  { label: "Denver",        region: "Denver",     state: "CO", country: "US", lat: 39.7392, lng: -104.9903, aliases: ["denver", "boulder, co", "boulder"] },
  { label: "Miami",         region: "Miami",      state: "FL", country: "US", lat: 25.7617, lng: -80.1918, aliases: ["miami"] },
  { label: "Washington DC", region: "Washington DC", state: "DC", country: "US", lat: 38.9072, lng: -77.0369,
    aliases: ["washington, dc", "washington dc", "washington d.c.", "arlington, va"] },

  // ---------- Canada / Europe ----------
  { label: "Toronto",       region: "Toronto",   country: "CA", lat: 43.6532, lng: -79.3832, aliases: ["toronto"] },
  { label: "London",        region: "London",    country: "GB", lat: 51.5074, lng: -0.1278,  aliases: ["london"] },
  { label: "Paris",         region: "Paris",     country: "FR", lat: 48.8566, lng: 2.3522,   aliases: ["paris"] },
  { label: "Berlin",        region: "Berlin",    country: "DE", lat: 52.5200, lng: 13.4050,  aliases: ["berlin"] },
  { label: "Amsterdam",     region: "Amsterdam", country: "NL", lat: 52.3676, lng: 4.9041,   aliases: ["amsterdam"] },
  { label: "Lisbon",        region: "Lisbon",    country: "PT", lat: 38.7223, lng: -9.1393,  aliases: ["lisbon", "lisboa"] },

  // ---------- Asia / ME / Pacific ----------
  { label: "Singapore",     region: "Singapore", country: "SG", lat: 1.3521,  lng: 103.8198, aliases: ["singapore"] },
  { label: "Tokyo",         region: "Tokyo",     country: "JP", lat: 35.6762, lng: 139.6503, aliases: ["tokyo", "東京"] },
  { label: "Seoul",         region: "Seoul",     country: "KR", lat: 37.5665, lng: 126.9780, aliases: ["seoul", "서울"] },
  { label: "Bengaluru",     region: "Bengaluru", country: "IN", lat: 12.9716, lng: 77.5946,  aliases: ["bengaluru", "bangalore"] },
  { label: "Dubai",         region: "Dubai",     country: "AE", lat: 25.2048, lng: 55.2708,  aliases: ["dubai"] },
  { label: "Sydney",        region: "Sydney",    country: "AU", lat: -33.8688, lng: 151.2093, aliases: ["sydney"] },
]
