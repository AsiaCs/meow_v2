import { Skeleton, SkeletonScreen, SkeletonRow, SkeletonTile } from "@/components/ui/skeleton"

// Mirrors dashboard/page.tsx: greeting, an events list, an internships grid.
export default function DashboardLoading() {
  return (
    <SkeletonScreen label="Loading your dashboard">
      <div className="px-6 pt-8 pb-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <Skeleton className="h-11 w-[22rem] max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 pt-2 pb-8 space-y-12">
        <section className="flex flex-col gap-5">
          <Skeleton className="h-6 w-48" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </section>
        <section className="flex flex-col gap-5">
          <Skeleton className="h-6 w-52" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonTile key={i} />)}
          </div>
        </section>
      </div>
    </SkeletonScreen>
  )
}
