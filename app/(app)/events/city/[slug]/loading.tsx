import { Skeleton, SkeletonScreen, SkeletonRow } from "@/components/ui/skeleton"

// Mirrors the city page: city heading, the count, then the same index rows.
export default function CityLoading() {
  return (
    <SkeletonScreen label="Loading events for this city">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-8 flex flex-col gap-6">
        <Skeleton className="h-11 w-72" />
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </SkeletonScreen>
  )
}
