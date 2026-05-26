"use client"

// Event Logistics Matcher — the carpool / housing coordinator panel that
// sits inside an event detail view. Two states:
//
//   1. Not opted in: a single inline toggle row, no data revealed
//   2. Opted in:    reveals the list of other opt-in attendees with their
//                   coordination handles (Telegram / Discord / email)
//
// Auth flow:
//   GET  /api/events/:id/coordinate                -> { wants }
//   POST /api/events/:id/coordinate { wants }      -> { wants }
//   GET  /api/events/:id/attendee-coordinates      -> { attendees } | 403

import { useEffect, useState } from "react"
import { Users, MapPin, Send, Hash, Mail, Loader2, AlertTriangle } from "lucide-react"

interface Attendee {
  id: string
  name: string | null
  image: string | null
  location: string | null
  telegram: string | null
  discord: string | null
  email: string | null
}

type LoadState = "idle" | "loading" | "ready" | "schemaMissing" | "unauth" | "error"

export function CoordinatePanel({ eventId }: { eventId: string }) {
  const [state, setState] = useState<LoadState>("loading")
  const [wants, setWants] = useState(false)
  const [busy, setBusy] = useState(false)
  const [attendees, setAttendees] = useState<Attendee[] | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setState("loading")
    fetch(`/api/events/${eventId}/coordinate`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.schemaMissing) {
          setState("schemaMissing")
          return
        }
        if (data?.authenticated === false) {
          setState("unauth")
          return
        }
        setWants(Boolean(data?.wants))
        setState("ready")
      })
      .catch(() => {
        if (!cancelled) setState("error")
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  // Load attendee list whenever the user is opted in
  useEffect(() => {
    if (state !== "ready" || !wants) {
      setAttendees(null)
      return
    }
    fetch(`/api/events/${eventId}/attendee-coordinates`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.ok) {
          setAttendees(Array.isArray(data.attendees) ? data.attendees : [])
        } else {
          setAttendees([])
        }
      })
      .catch(() => setAttendees([]))
  }, [state, wants, eventId])

  async function toggle() {
    setBusy(true)
    setErrorText(null)
    try {
      const next = !wants
      const res = await fetch(`/api/events/${eventId}/coordinate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wants: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorText(data?.error ?? `HTTP ${res.status}`)
      } else {
        setWants(Boolean(data?.wants))
      }
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : "network error")
    } finally {
      setBusy(false)
    }
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Loader2 size={12} className="animate-spin" />
        Loading coordinator…
      </div>
    )
  }
  if (state === "unauth") {
    return (
      <div className="text-xs text-text-muted">
        Sign in to coordinate rides &amp; housing with other attendees.
      </div>
    )
  }
  if (state === "schemaMissing") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-300/90">
        <AlertTriangle size={12} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" />
        <span>
          Coordinator table not provisioned yet. Run the{" "}
          <code className="font-mono">event_coordinations</code> migration in
          Supabase and refresh.
        </span>
      </div>
    )
  }
  if (state === "error") {
    return <div className="text-xs text-red-400">Could not load coordinator.</div>
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5">
      <div className="rounded-[calc(1rem-0.375rem)] bg-bg-card p-4">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={wants}
          className="flex items-center justify-between gap-3 w-full text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple/15 flex items-center justify-center flex-shrink-0">
              <Users size={16} strokeWidth={1.75} className="text-purple-light" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Share Ride &amp; Stay for this event
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Opt in to split carpool, hotel, or housing with other attendees.
                Your handles are only shown to people who also opted in.
              </p>
            </div>
          </div>
          <span
            className={
              "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 " +
              (wants ? "bg-purple" : "bg-white/[0.1]")
            }
          >
            <span
              className={
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 my-0.5 " +
                (wants ? "translate-x-5" : "translate-x-0.5")
              }
            />
          </span>
        </button>

        {errorText && (
          <p className="text-xs text-red-400 mt-2">{errorText}</p>
        )}

        {wants && attendees && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-3">
              {attendees.length === 0
                ? "You're the first one in. Check back as more attendees opt in."
                : `${attendees.length} ${attendees.length === 1 ? "person" : "people"} also coordinating`}
            </p>
            <ul className="space-y-2">
              {attendees.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2"
                >
                  <Avatar name={a.name ?? "Anonymous"} image={a.image} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {a.name ?? "Anonymous"}
                    </p>
                    {a.location && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <MapPin size={10} strokeWidth={1.5} />
                        {a.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.telegram && <HandlePill kind="telegram" value={a.telegram} />}
                    {a.discord && <HandlePill kind="discord" value={a.discord} />}
                    {a.email && <HandlePill kind="email" value={a.email} />}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
  }
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: "var(--gradient-brand)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function HandlePill({
  kind,
  value,
}: {
  kind: "telegram" | "discord" | "email"
  value: string
}) {
  const trimmed = value.trim().replace(/^@/, "")
  let href: string | null = null
  let Icon = Hash
  let display = `@${trimmed}`
  let cls = "text-text-secondary border-border"

  if (kind === "telegram") {
    href = `https://t.me/${encodeURIComponent(trimmed)}`
    Icon = Send
    cls = "text-[#229ED9] border-[#229ED9]/30 hover:bg-[#229ED9]/10"
  } else if (kind === "discord") {
    Icon = Hash
    display = trimmed
    cls = "text-[#5865F2] border-[#5865F2]/30 hover:bg-[#5865F2]/10"
  } else if (kind === "email") {
    href = `mailto:${value}`
    Icon = Mail
    display = value
    cls = "text-text-secondary border-border hover:bg-white/[0.04]"
  }

  const content = (
    <>
      <Icon size={11} strokeWidth={1.75} />
      <span className="truncate max-w-[140px]">{display}</span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${cls}`}
      >
        {content}
      </a>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
    >
      {content}
    </span>
  )
}
