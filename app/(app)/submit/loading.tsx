import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"

// Mirrors submit/page.tsx: the single form card with its stacked fields.
export default function SubmitLoading() {
  return (
    <SkeletonScreen label="Loading the submission form">
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-6">
        <Skeleton className="h-11 w-60" />
        <div className="rounded-panel border border-border-subtle bg-bg-raised p-6 flex flex-col gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-11 w-full rounded-panel" />
            </div>
          ))}
          <Skeleton className="h-11 w-36 rounded-control" />
        </div>
      </div>
    </SkeletonScreen>
  )
}
