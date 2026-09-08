import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"

// Mirrors the event detail page: cover, badge row, title, metadata stack, CTA.
export default function EventDetailLoading() {
  return (
    <SkeletonScreen label="Loading event">
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-36 w-full rounded-panel" />
        <div className="rounded-panel border border-border-subtle bg-bg-raised p-6 flex flex-col gap-5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-control" />
            <Skeleton className="h-6 w-24 rounded-control" />
          </div>
          <Skeleton className="h-8 w-[80%]" />
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-11 w-40 rounded-control" />
        </div>
      </div>
    </SkeletonScreen>
  )
}
