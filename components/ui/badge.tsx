import { cn } from "@/lib/utils"

// Variants are named for meaning, never colour. In a grayscale-first system
// most badges should be neutral: reach for a semantic variant only when the
// state genuinely matters, and for accent only when it is the single most
// important thing on the screen.
type BadgeVariant = "neutral" | "accent" | "positive" | "critical" | "outline"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-bg-raised text-text-secondary border-border-subtle",
  accent: "bg-accent/8 text-accent border-accent/20",
  positive: "bg-positive/8 text-positive border-positive/20",
  critical: "bg-critical/8 text-critical border-critical/20",
  outline: "bg-transparent text-text-secondary border-border-default",
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        // 6px keeps badges inside the tightened shape language rather than
        // reading as leftover pills from the previous system.
        "inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5",
        "text-meta font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export type { BadgeVariant }
