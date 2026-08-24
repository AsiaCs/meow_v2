// Event times must render in the EVENT's timezone, not the server's.
//
// THE BUG THIS FIXES: Vercel's runtime is UTC, and the landing page formats
// dates in a server component. toLocaleTimeString() with no timeZone therefore
// used UTC and labelled it as if it were local — "Pebblebed's Builders Late
// Night Café, 2:30 AM · San Francisco" for a 7:30 PM event. Every time on the
// page was wrong, and wrong in a way that looked plausible.
//
// Showing the viewer's local time would be a different bug: an events product
// showing "3:00 AM" to a London reader for a San Francisco meetup is useless.
// Luma and every calendar app show event-local time, and so does this.
//
// Resolving server-side keeps it correct without JS, which matters because the
// hero is a server component by design.

const CITY_TZ: Array<[RegExp, string]> = [
  [/san francisco|sunnyvale|palo alto|menlo park|mountain view|san jose|oakland|berkeley/i, "America/Los_Angeles"],
  [/los angeles|santa monica|venice|hollywood|pasadena/i, "America/Los_Angeles"],
  [/seattle|bellevue|redmond|portland/i, "America/Los_Angeles"],
  [/new york|brooklyn|queens|manhattan|bronx|jersey city/i, "America/New_York"],
  [/washington|arlington|alexandria|bethesda|baltimore/i, "America/New_York"],
  [/boston|cambridge|somerville/i, "America/New_York"],
  [/miami|atlanta|philadelphia|pittsburgh/i, "America/New_York"],
  [/toronto|ottawa|montreal/i, "America/Toronto"],
  [/chicago|austin|dallas|houston|minneapolis/i, "America/Chicago"],
  [/denver|boulder|salt lake/i, "America/Denver"],
  [/london|dublin|edinburgh/i, "Europe/London"],
  [/berlin|munich|paris|amsterdam|madrid|barcelona|lisbon|zurich/i, "Europe/Berlin"],
  [/singapore/i, "Asia/Singapore"],
  [/bangalore|bengaluru|mumbai|delhi/i, "Asia/Kolkata"],
  [/tokyo/i, "Asia/Tokyo"],
  [/sydney|melbourne/i, "Australia/Sydney"],
]

// Falls back to UTC rather than guessing. A wrong-but-confident time is worse
// than one that is at least consistent, and unknown cities are rare enough to
// surface rather than paper over.
export function timeZoneFor(city: string | null | undefined, location?: string | null): string {
  const haystack = `${city ?? ""} ${location ?? ""}`.trim()
  if (!haystack) return "UTC"
  for (const [re, tz] of CITY_TZ) if (re.test(haystack)) return tz
  return "UTC"
}

export function formatInZone(iso: string, tz: string) {
  const d = new Date(iso)
  const part = (opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleString("en-US", { ...opts, timeZone: tz })

  return {
    weekday: part({ weekday: "short" }).toUpperCase(),
    month: part({ month: "short" }).toUpperCase(),
    dayNum: part({ day: "2-digit" }),
    time: part({ hour: "numeric", minute: "2-digit" }),
    // Stable key for grouping by the event's own calendar day.
    dayKey: part({ year: "numeric", month: "2-digit", day: "2-digit" }),
  }
}
