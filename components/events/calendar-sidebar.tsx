"use client"

import { useState } from "react"
import Link from "next/link"
import { DayPicker } from "react-day-picker"
import { CalendarDays, MapPin, Monitor } from "lucide-react"
import { cn, formatDate, formatDateShort } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface EventItem {
  id: string
  title: string
  startDate: Date | string
  isVirtual: boolean
  location?: string
  isFree: boolean
}

interface CalendarSidebarProps {
  events: EventItem[]
  selectedDate: Date | null
  onDateChange: (date: Date | null) => void
}

export function CalendarSidebar({
  events,
  selectedDate,
  onDateChange,
}: CalendarSidebarProps) {
  const [month, setMonth] = useState<Date>(new Date())

  // Collect dates that have events
  const eventDates = events.map((e) =>
    new Date(e.startDate instanceof Date ? e.startDate : new Date(e.startDate))
  )

  const modifiers = {
    hasEvent: eventDates,
  }

  // Next 5 upcoming events sorted
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 5)

  return (
    <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0 border-l border-border bg-bg-surface min-h-dvh sticky top-0 overflow-y-auto">
      <div className="p-5">
        {/* Calendar */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Calendar
          </h3>
          <DayPicker
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(day) => onDateChange(day ?? null)}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              month_caption: "flex items-center justify-between px-1 mb-3",
              caption_label:
                "text-sm font-semibold text-text-primary",
              nav: "flex items-center gap-1",
              button_previous:
                "p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors",
              button_next:
                "p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors",
              month_grid: "w-full border-collapse",
              weekdays: "flex w-full mb-1",
              weekday:
                "flex-1 text-center text-[11px] font-medium text-text-muted py-1",
              week: "flex w-full",
              day: "flex-1 text-center",
              day_button: cn(
                "w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-150",
                "text-text-secondary hover:text-text-primary hover:bg-white/[0.06]",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple/40"
              ),
              selected:
                "bg-purple text-white rounded-lg",
              today: "text-purple font-semibold",
              outside: "opacity-30",
              disabled: "opacity-20 cursor-not-allowed",
            }}
            modifiersClassNames={{
              hasEvent:
                "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-pink",
            }}
          />
        </div>

        {/* Clear filter */}
        {selectedDate && (
          <button
            onClick={() => onDateChange(null)}
            className="text-xs text-purple hover:text-purple-light transition-colors mb-4"
          >
            Clear date filter
          </button>
        )}

        {/* Upcoming events mini list */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Coming Up
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-text-muted">No upcoming events</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-start gap-3 group rounded-xl -mx-2 px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-bg-elevated border border-border flex items-center justify-center group-hover:border-purple/40 transition-colors">
                      <CalendarDays
                        size={14}
                        strokeWidth={1.5}
                        className="text-purple"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate group-hover:text-purple-light transition-colors">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {formatDateShort(event.startDate)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {event.isVirtual ? (
                          <span className="text-[11px] text-purple flex items-center gap-0.5">
                            <Monitor size={10} strokeWidth={1.5} />
                            Virtual
                          </span>
                        ) : event.location ? (
                          <span className="text-[11px] text-text-muted flex items-center gap-0.5 truncate">
                            <MapPin size={10} strokeWidth={1.5} className="flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
