import { cn } from "@/lib/utils"

// Skeletons, not spinners. A spinner says "something is happening"; a skeleton
// says "here is the shape of what is arriving". Each one mirrors the layout it
// replaces so nothing jumps when the content lands.
//
// The shimmer stops entirely under Reduce Motion, where the plate alone still
// communicates the loading state.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-control bg-bg-raised",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-[linear-gradient(90deg,transparent,var(--color-bg-sunken),transparent)]",
        "after:animate-[shimmer_1.6s_infinite]",
        "motion-reduce:after:hidden",
        className
      )}
    />
  )
}

export function SkeletonScreen({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-stretch gap-4 p-3 rounded-panel border border-border-subtle bg-bg-base">
      <Skeleton className="w-[88px] h-[88px] rounded-control shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2.5 py-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-5 w-[72%]" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function SkeletonTile() {
  return (
    <div className="rounded-panel border border-border-subtle bg-bg-base p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-control shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-[85%]" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-[6px]" />
        <Skeleton className="h-5 w-16 rounded-[6px]" />
      </div>
      <div className="flex-1" />
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-20 rounded-control" />
      </div>
    </div>
  )
}
