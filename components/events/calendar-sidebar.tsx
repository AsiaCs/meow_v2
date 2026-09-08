"use client"

import { useState } from "react"
import Link from "next/link"
import { DayPicker } from "react-day-picker"
import { CalendarDots as CalendarDays, MapPin, Monitor } from "@phosphor-icons/react"
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
  /** Active city pill from the parent. Surfaced in the "Coming Up" heading
   *  so users see why only certain events are listed. null = Everywhere. */
  cityLabel?: string | null
}

export function CalendarSidebar({
  events,
  selectedDate,
  onDateChange,
  cityLabel = null,
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
    <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 border border-border-subtle bg-bg-raised rounded-panel mr-4 mt-4 mb-4 sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <div className="p-5">
        {/* Calendar */}
        <div className="mb-6">
          <h3 className="text-meta font-semibold text-text-muted mb-4 uppercase tracking-[0.22em]">
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
                "text-body font-semibold text-text-primary",
              nav: "flex items-center gap-1",
              button_previous:
                "p-1 rounded-control text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors",
              button_next:
                "p-1 rounded-control text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors",
              month_grid: "w-full border-collapse",
              weekdays: "flex w-full mb-1",
              weekday:
                "flex-1 text-center text-meta font-medium text-text-muted py-1",
              week: "flex w-full",
              day: "flex-1 text-center",
              day_button: cn(
                "w-full aspect-square flex items-center justify-center text-body rounded-control transition-all duration-150",
                "text-text-secondary hover:text-text-primary hover:bg-bg-raised",
                "focus-visible:outline-none"
              ),
              selected:
                "bg-bg-inverse text-text-inverse border-transparent !rounded-control !text-body !font-medium",
              today: "text-accent font-semibold",
              outside: "opacity-30",
              disabled: "opacity-20 cursor-not-allowed",
            }}
            modifiersClassNames={{
              hasEvent:
                "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-control after:bg-bg-inverse",
            }}
          />
        </div>

        {/* Clear filter */}
        {selectedDate && (
          <button
            onClick={() => onDateChange(null)}
            className="text-meta text-accent hover:text-accent transition-colors mb-4"
          >
            Clear date filter
          </button>
        )}

        {/* Upcoming events mini list */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-meta font-semibold text-text-muted uppercase tracking-[0.22em]">
              Coming Up
            </h3>
            {cityLabel && (
              <span className="text-meta font-semibold text-accent uppercase tracking-[0.18em]">
                in {cityLabel}
              </span>
            )}
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-meta text-text-muted">
              {cityLabel
                ? `No upcoming events in ${cityLabel}.`
                : "No upcoming events."}
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-start gap-3 group rounded-panel -mx-1.5 px-2 py-2 hover:bg-bg-raised transition-colors"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-control border border-border-subtle bg-bg-raised flex items-center justify-center">
                      <CalendarDays
                        size={14}
                        className="text-accent"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-meta font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                        {event.title}
                      </p>
                      <p className="text-meta text-text-muted mt-0.5">
                        {formatDateShort(event.startDate)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {event.isVirtual ? (
                          <span className="text-meta text-accent flex items-center gap-0.5">
                            <Monitor size={10} />
                            Virtual
                          </span>
                        ) : event.location ? (
                          <span className="text-meta text-text-muted flex items-center gap-0.5 truncate">
                            <MapPin size={10} className="flex-shrink-0" />
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
