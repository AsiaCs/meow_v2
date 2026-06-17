import { cn } from "@/lib/utils"

interface CardProps {
  children?: React.ReactNode
  className?: string
  innerClassName?: string
}

interface CardSectionProps {
  children?: React.ReactNode
  className?: string
}

// Single source of truth for every form / panel container in the app.
// Switched from a doubled border+bg-bg-card plate to a real .glass surface
// so the aurora behind bleeds through every form (submit, profile, etc).
// No more dark rectangle behind the liquid-glass UI.
export function Card({ children, className, innerClassName }: CardProps) {
  return (
    <div className={cn("glass rounded-3xl", className)}>
      <div className={cn("rounded-3xl overflow-hidden", innerClassName)}>
        {children}
      </div>
    </div>
  )
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("px-6 pt-6 pb-4 border-b border-white/[0.06]", className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: CardSectionProps) {
  return (
    <div className={cn("px-6 py-5", className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div
      className={cn(
        "px-6 pb-6 pt-4 border-t border-white/[0.06] flex items-center gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}
