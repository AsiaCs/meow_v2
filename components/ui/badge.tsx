import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "purple" | "pink" | "green" | "gray" | "outline"
  className?: string
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  purple: "bg-brand/15 text-brand border-transparent",
  pink: "bg-brand-hi/15 text-brand-hi border-transparent",
  green: "bg-positive/15 text-positive border-transparent",
  gray: "bg-bg-surface text-text-secondary border-transparent",
  outline: "bg-transparent text-text-secondary border-border-strong",
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
