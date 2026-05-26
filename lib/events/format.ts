// Display formatters for event datetimes and locations. Shared between the
// event card, event detail page, and email digest so the same string format
// shows everywhere.

const DEFAULT_TZ = "America/Los_Angeles"

// Returns "Wed, May 27 · 3:00 PM PDT" — the spec format Cerebral Valley uses.
export function formatEventStamp(
  d: Date | string,
  timeZone: string = DEFAULT_TZ,
): string {
  const date = typeof d === "string" ? new Date(d) : d
  if (isNaN(date.getTime())) return ""

  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  })

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone,
  })

  return `${day} · ${time}`
}

// "San Francisco, CA" or "Shack15, San Francisco". Returns "Virtual" for online
// events. Trims and normalizes whitespace so the API's free-form strings show
// cleanly in the UI.
export function formatEventLocation(
  location: string | null | undefined,
  isVirtual: boolean,
): string {
  if (isVirtual) return "Virtual"
  if (!location) return ""
  return location.trim().replace(/\s+/g, " ")
}
