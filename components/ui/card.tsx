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

export function Card({ children, className, innerClassName }: CardProps) {
  return (
    <div
      className={cn(
        "border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02]",
        className
      )}
    >
      <div
        className={cn(
          "bg-bg-card rounded-[calc(1.5rem-0.375rem)] overflow-hidden",
          innerClassName
        )}
      >
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
