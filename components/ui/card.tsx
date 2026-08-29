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
// Flat bordered plate on the base surface — the same register as every other
// panel in the rebuild (see card.tsx sibling: shadow-card is `none` in the
// token set, no blur, no glow).
export function Card({ children, className, innerClassName }: CardProps) {
  return (
    <div className={cn("rounded-3xl border border-border bg-bg-card", className)}>
      <div className={cn("rounded-3xl overflow-hidden", innerClassName)}>
        {children}
      </div>
    </div>
  )
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("px-6 pt-6 pb-4 border-b border-border", className)}>
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
        "px-6 pb-6 pt-4 border-t border-border flex items-center gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}
