import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "purple" | "pink" | "green" | "gray" | "outline"
  className?: string
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  purple: "bg-purple/15 text-purple-light border-transparent",
  pink: "bg-pink/15 text-pink-light border-transparent",
  green: "bg-emerald-500/15 text-emerald-400 border-transparent",
  gray: "bg-white/[0.06] text-text-secondary border-transparent",
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
