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

// Single source of truth for every form and panel container.
//
// A hairline plate at 12px radius, no shadow. Dramatic elevation is a
// default-AI tell and in a light minimal system it reads as dirt on the page.
// Depth, where it is genuinely needed, comes from the surface ladder.
export function Card({ children, className, innerClassName }: CardProps) {
  return (
    <div className={cn("rounded-panel border border-border-subtle bg-bg-base", className)}>
      <div className={cn("rounded-panel overflow-hidden", innerClassName)}>
        {children}
      </div>
    </div>
  )
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("px-6 pt-5 pb-4 border-b border-border-subtle", className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div
      className={cn(
        "px-6 pb-5 pt-4 border-t border-border-subtle flex items-center gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}
