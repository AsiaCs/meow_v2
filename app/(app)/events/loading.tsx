import { Skeleton, SkeletonScreen, SkeletonRow } from "@/components/ui/skeleton"

// Mirrors events/page.tsx: heading, the filter pill row, then the index rows.
// The pill widths are deliberately uneven, matching real filter labels rather
// than a row of identical blocks that reads as a placeholder.
const PILL_WIDTHS = ["w-24", "w-20", "w-28", "w-16", "w-24"]

export default function EventsLoading() {
  return (
    <SkeletonScreen label="Loading events">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-8 flex flex-col gap-6">
        <Skeleton className="h-11 w-56" />
        <div className="flex flex-wrap gap-2">
          {PILL_WIDTHS.map((w, i) => (
            <Skeleton key={i} className={`h-9 rounded-control ${w}`} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </SkeletonScreen>
  )
}
