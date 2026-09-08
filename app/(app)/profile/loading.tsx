import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"

// Mirrors profile/page.tsx: identity header, then the stacked section cards.
export default function ProfileLoading() {
  return (
    <SkeletonScreen label="Loading your profile">
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-6">
        <div className="rounded-panel border border-border-subtle bg-bg-raised p-6 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-control shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-panel border border-border-subtle bg-bg-raised p-6 flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}
