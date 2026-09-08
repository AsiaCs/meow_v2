import { Skeleton, SkeletonScreen, SkeletonTile } from "@/components/ui/skeleton"

// Mirrors internships/page.tsx: heading, filter row, then the tile grid.
export default function InternshipsLoading() {
  return (
    <SkeletonScreen label="Loading internships">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-8 flex flex-col gap-6">
        <Skeleton className="h-11 w-64" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-control" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)}
        </div>
      </div>
    </SkeletonScreen>
  )
}
