"use client"

// A simple, accessible time picker that's much nicer than the native
// <input type="time"> control on desktop.
//
// • One <select> for hour (1-12), one for minute (00 / 15 / 30 / 45), one
//   for AM/PM. Each is a real <select> so it gets the OS-native picker on
//   mobile and a clean dropdown on desktop — no positioning logic, no
//   focus traps, no library.
//
// • Value is a 24-hour "HH:MM" string ("09:30", "14:45"), to match what
//   <input type="time"> produces — so the rest of the form code keeps
//   working without changes.

import { useId } from "react"
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
  step = 15,
  className,
}: TimePickerProps) {
  const id = useId()
  const parts = parse24(value) ?? { h12: 12, min: 0, ampm: "AM" as const }
  const isEmpty = !value

  const minutes: number[] = []
  for (let m = 0; m < 60; m += step) minutes.push(m)

  const setHour = (h12: number) => onChange(compose24(h12, parts.min, parts.ampm))
  const setMin = (min: number) => onChange(compose24(parts.h12, min, parts.ampm))
  const setAmPm = (ampm: "AM" | "PM") => onChange(compose24(parts.h12, parts.min, ampm))

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

        <NativeSelect
          aria-label="Minute"
          value={isEmpty ? "" : parts.min}
          onChange={(e) => setMin(Number(e.target.value))}
          required={required}
        >
          {isEmpty && <option value="" disabled hidden>—</option>}
          {minutes.map((m) => (
            <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
          ))}
        </NativeSelect>

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
      className={cn(
        // Reset and style to match the rest of the form. Native arrow is
        // hidden — we draw our own subtle caret via background-image to
        // keep three side-by-side selects visually consistent.
        "appearance-none bg-transparent text-text-primary text-sm",
        "px-4 py-2.5 cursor-pointer outline-none",
        "pr-7 bg-no-repeat",
        "[background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 4l3 3 3-3' fill='none' stroke='%239b8fb1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")]",
        "[background-position:right_8px_center]",
        "min-w-[60px] text-center",
        className,
      )}
    >
      {children}
    </select>
  )
}
