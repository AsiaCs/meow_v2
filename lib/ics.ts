// Minimal RFC-5545 ICS file generator. No deps — keeps the cold-start path tight.

export interface ICSEvent {
  uid: string                       // stable per event
  title: string
  description?: string
  location?: string
  url?: string
  startDate: Date
  endDate?: Date                    // defaults to startDate + 1h
  organizerName?: string
  organizerEmail?: string
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

function toICSDate(d: Date): string {
  // Always emit as UTC (suffix Z) — most calendar clients respect this and
  // re-render in the viewer's local timezone.
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

// RFC-5545 text fold + escape: replace commas/semicolons/newlines, wrap at 75 octets.
function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let cursor = 0
  while (cursor < line.length) {
    const chunk = line.slice(cursor, cursor + (cursor === 0 ? 75 : 74))
    parts.push((cursor === 0 ? "" : " ") + chunk)
    cursor += cursor === 0 ? 75 : 74
  }
  return parts.join("\r\n")
}

function line(key: string, value: string | undefined): string | null {
  if (value === undefined || value === "") return null
  return fold(`${key}:${escapeText(value)}`)
}

export function buildICS(ev: ICSEvent): string {
  const end = ev.endDate ?? new Date(ev.startDate.getTime() + 60 * 60 * 1000)
  const lines: Array<string | null> = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//meow//meow events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    line("UID", `${ev.uid}@meow.app`),
    line("DTSTAMP", toICSDate(new Date())),
    line("DTSTART", toICSDate(ev.startDate)),
    line("DTEND", toICSDate(end)),
    line("SUMMARY", ev.title),
    ev.description ? line("DESCRIPTION", ev.description) : null,
    ev.location ? line("LOCATION", ev.location) : null,
    ev.url ? line("URL", ev.url) : null,
    ev.organizerEmail
      ? `ORGANIZER;CN=${escapeText(ev.organizerName ?? "Host")}:mailto:${ev.organizerEmail}`
      : null,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.filter((l): l is string => l !== null).join("\r\n")
}
