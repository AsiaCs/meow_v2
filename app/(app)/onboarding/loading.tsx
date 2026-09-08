import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"

// Mirrors onboarding/page.tsx: step indicator, prompt, then the option grid.
export default function OnboardingLoading() {
  return (
    <SkeletonScreen label="Loading onboarding">
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-16 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-control" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-[70%]" />
          <Skeleton className="h-4 w-[50%]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-panel" />
          ))}
        </div>
      </div>
    </SkeletonScreen>
  )
}
