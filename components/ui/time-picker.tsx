"use client"

// A simple, accessible time picker that's much nicer than the native
// <input type="time"> control on desktop.
//
// • <select> for hour (1-12) and AM/PM. Real <select>s, so OS-native
//   picker on mobile and clean dropdown on desktop.
//
// • Minute is a typeable text input so the user can enter ANY value 0-59
//   directly (e.g. "37", "08"). Replaces the previous 00/15/30/45-only
//   dropdown that the user explicitly called out as too restrictive.
//
// • Value is a 24-hour "HH:MM" string ("09:30", "14:37"), to match what
//   <input type="time"> produces — so the rest of the form code keeps
//   working without changes.

import { useId, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  label?: string
  value: string                     // "HH:MM" 24h, e.g. "09:30"
  onChange: (value: string) => void
  required?: boolean
  error?: string
  /** Minute granularity in the dropdown. Defaults to 15. */
  step?: 5 | 15 | 30 | 60
  className?: string
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

function parse24(value: string): { h12: number; min: number; ampm: "AM" | "PM" } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return { h12, min, ampm }
}

function compose24(h12: number, min: number, ampm: "AM" | "PM"): string {
  let h = h12 % 12
  if (ampm === "PM") h += 12
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
}

export function TimePicker({
  label,
  value,
  onChange,
  required,
  error,
  className,
}: TimePickerProps) {
  const id = useId()
  const parts = parse24(value) ?? { h12: 12, min: 0, ampm: "AM" as const }
  const isEmpty = !value

  // Local minute string lets the user type freely (including the half-typed
  // "0" before the second digit) without us snapping the value back. On
  // blur we clamp + pad + commit to the parent's 24h HH:MM format.
  const [minText, setMinText] = useState<string>(isEmpty ? "" : parts.min.toString().padStart(2, "0"))
  useEffect(() => {
    if (!isEmpty) setMinText(parts.min.toString().padStart(2, "0"))
  }, [parts.min, isEmpty])

  const setHour = (h12: number) => onChange(compose24(h12, parts.min, parts.ampm))
  const setAmPm = (ampm: "AM" | "PM") => onChange(compose24(parts.h12, parts.min, ampm))

  const commitMin = (raw: string) => {
    const n = parseInt(raw, 10)
    const clamped = Number.isFinite(n) ? Math.max(0, Math.min(59, n)) : parts.min
    onChange(compose24(parts.h12, clamped, parts.ampm))
    setMinText(clamped.toString().padStart(2, "0"))
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div
        id={id}
        className={cn(
          "flex items-stretch rounded-xl overflow-hidden border bg-bg-surface transition-colors",
          error
            ? "border-red-500/60 focus-within:border-red-500"
            : "border-border focus-within:border-purple focus-within:ring-1 focus-within:ring-purple/20",
        )}
      >
        <NativeSelect
          aria-label="Hour"
          value={isEmpty ? "" : parts.h12}
          onChange={(e) => setHour(Number(e.target.value))}
          required={required}
        >
          {isEmpty && <option value="" disabled hidden>—</option>}
          {HOURS_12.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </NativeSelect>

        <span className="self-center text-text-muted text-lg leading-none select-none">:</span>

        {/* Free-text minute — user can type any value 0–59 (no preset
            00/15/30/45 lock-in). Clamped + padded on blur. */}
        <input
          aria-label="Minute"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={minText}
          placeholder="—"
          required={required}
          onChange={(e) => setMinText(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={(e) => commitMin(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
          className="appearance-none bg-transparent text-text-primary text-sm text-center px-4 py-2.5 outline-none min-w-[60px] placeholder:text-text-muted"
        />

        <span className="w-px self-stretch bg-border" />

        <NativeSelect
          aria-label="AM or PM"
          value={isEmpty ? "" : parts.ampm}
          onChange={(e) => setAmPm(e.target.value as "AM" | "PM")}
          required={required}
        >
          {isEmpty && <option value="" disabled hidden>—</option>}
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </NativeSelect>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props
  return (
    <select
      {...rest}
      // color-scheme: dark tells the OS / browser to render the popup
      // dropdown in dark mode (white text on dark surface) instead of the
      // default light theme that gave us white-on-white invisible numbers.
      style={{ colorScheme: "dark" }}
      className={cn(
        // Closed-state styling. Options inherit color from the select.
        "appearance-none bg-transparent text-text-primary text-sm",
        "px-4 py-2.5 cursor-pointer outline-none",
        "pr-7 bg-no-repeat",
        "[background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 4l3 3 3-3' fill='none' stroke='%239b8fb1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")]",
        "[background-position:right_8px_center]",
        "min-w-[60px] text-center",
        // Open-state options: belt-and-suspenders for browsers that ignore
        // color-scheme on options. Forces visible dark bg + light text.
        "[&_option]:bg-bg-card [&_option]:text-text-primary",
        className,
      )}
    >
      {children}
    </select>
  )
}
