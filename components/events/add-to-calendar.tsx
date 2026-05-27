"use client"

// Multi-provider Add-to-Calendar control. Required for App Store submission so
// users on iOS (Apple Calendar) and the web (Google Calendar / Outlook) both
// have a one-tap path.
//
// Three providers, all generated client-side from event metadata — no server
// round trip needed:
//
//   Google Calendar  ->  https://calendar.google.com/calendar/render?action=TEMPLATE&...
//   Apple Calendar   ->  webcal:// link OR .ics download (iOS opens .ics natively)
//   Outlook (web)    ->  https://outlook.live.com/calendar/0/deeplink/compose?...
//
// .ics download is the universal fallback — works on every desktop client.

import { useEffect, useRef, useState } from "react"
import { CalendarPlus, ChevronDown, Download } from "lucide-react"

interface AddToCalendarProps {
  eventId: string                       // for the /api/events/:id/ics download
  title: string
  description?: string | null
  startDate: Date | string
  endDate?: Date | string | null
  location?: string | null
  isVirtual?: boolean
  registrationUrl?: string | null
  className?: string
}

// Format a Date as YYYYMMDDTHHmmssZ (the format Google/Outlook deeplinks expect)
function compactUtc(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

function bodyText(args: {
  description?: string | null
  registrationUrl?: string | null
}): string {
  const parts: string[] = []
  if (args.description) parts.push(args.description)
  if (args.registrationUrl) parts.push(args.registrationUrl)
  return parts.join("\n\n")
}

function buildGoogleUrl(p: AddToCalendarProps, start: Date, end: Date): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: p.title,
    dates: `${compactUtc(start)}/${compactUtc(end)}`,
    details: bodyText({ description: p.description, registrationUrl: p.registrationUrl }),
    location: p.isVirtual ? "Online" : p.location ?? "",
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildOutlookUrl(p: AddToCalendarProps, start: Date, end: Date): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: p.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: bodyText({ description: p.description, registrationUrl: p.registrationUrl }),
    location: p.isVirtual ? "Online" : p.location ?? "",
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Detect iOS / macOS so Apple Calendar option uses the native .ics open path
function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
}

export function AddToCalendar(props: AddToCalendarProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const start =
    typeof props.startDate === "string" ? new Date(props.startDate) : props.startDate
  const end =
    props.endDate
      ? typeof props.endDate === "string"
        ? new Date(props.endDate)
        : props.endDate
      : new Date(start.getTime() + 60 * 60 * 1000)

  const icsUrl = `/api/events/${props.eventId}/ics`
  const googleUrl = buildGoogleUrl(props, start, end)
  const outlookUrl = buildOutlookUrl(props, start, end)

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className={`relative ${props.className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 sm:px-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-text-secondary hover:bg-white/[0.04] hover:text-text-primary font-medium text-sm transition-all"
      >
        <CalendarPlus size={16} strokeWidth={1.5} />
        Add to Calendar
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={`opacity-70 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 z-30 rounded-2xl border border-white/[0.08] bg-bg-card shadow-xl p-1.5 origin-top-right animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <ProviderItem
            href={googleUrl}
            label="Google Calendar"
            sub="Adds to google.com/calendar"
            icon={<GoogleIcon />}
            external
          />
          <ProviderItem
            href={icsUrl}
            label={isAppleDevice() ? "Apple Calendar" : "Apple Calendar (.ics)"}
            sub="Opens natively on iPhone, iPad, Mac"
            icon={<AppleIcon />}
            download={`${slug(props.title)}.ics`}
          />
          <ProviderItem
            href={outlookUrl}
            label="Outlook"
            sub="Office 365 / Outlook.com"
            icon={<OutlookIcon />}
            external
          />
          <div className="h-px bg-white/[0.06] my-1.5 mx-1" />
          <ProviderItem
            href={icsUrl}
            label="Download .ics file"
            sub="Universal — works in any calendar app"
            icon={<Download size={14} strokeWidth={1.75} className="text-text-secondary" />}
            download={`${slug(props.title)}.ics`}
          />
        </div>
      )}
    </div>
  )
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event"
}

function ProviderItem({
  href,
  label,
  sub,
  icon,
  external,
  download,
}: {
  href: string
  label: string
  sub: string
  icon: React.ReactNode
  external?: boolean
  download?: string
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      download={download}
      role="menuitem"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
    >
      <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="block text-[11px] text-text-muted truncate">{sub}</span>
      </span>
    </a>
  )
}

// --- Brand icons (inline SVG; lucide doesn't ship these) ---
function GoogleIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-4.9c-1.9 1.3-4.3 2.1-6.9 2.1-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6 4.9c-.4.4 6.6-4.8 6.6-14.5 0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
function AppleIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="text-text-primary" aria-hidden="true">
      <path d="M17.05 12.04c-.03-2.84 2.32-4.21 2.43-4.28-1.33-1.94-3.39-2.2-4.12-2.23-1.75-.18-3.42 1.03-4.31 1.03-.89 0-2.27-1-3.73-.98-1.92.03-3.69 1.12-4.68 2.83-2 3.46-.51 8.58 1.43 11.39.95 1.37 2.07 2.91 3.54 2.86 1.42-.06 1.96-.92 3.67-.92 1.71 0 2.2.92 3.7.89 1.53-.03 2.5-1.4 3.43-2.77 1.09-1.59 1.54-3.13 1.56-3.21-.03-.01-2.99-1.15-3.02-4.61zM14.4 4.18c.78-.94 1.31-2.25 1.16-3.56-1.12.05-2.48.75-3.29 1.69-.73.83-1.36 2.17-1.19 3.45 1.25.1 2.53-.63 3.32-1.58z" />
    </svg>
  )
}
function OutlookIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#0078D4" d="M19 4h11.5L31 4.5v23l-.5.5H19V4z" />
      <path fill="#0078D4" d="M19 16l12-8v16l-12-8z" opacity="0.6" />
      <path fill="#fff" d="M19 4h11.5L31 4.5v23l-.5.5H19V4zm1 1v22h10V5H20z" />
      <rect x="1" y="6" width="18" height="20" fill="#0078D4" />
      <text x="10" y="20" fontSize="12" fontFamily="Arial" fill="#fff" textAnchor="middle" fontWeight="bold">O</text>
    </svg>
  )
}
