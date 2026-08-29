import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Mobbin pattern: primary is solid monochrome (white on base), not a
    // gradient brand wash. Symmetric padding scales across all sizes.
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
      primary:
        "bg-text-primary text-bg-base hover:bg-text-primary/90",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface",
      outline:
        "border border-border-subtle text-text-primary hover:border-border-strong bg-transparent",
      danger:
        "bg-critical/10 border border-critical/20 text-critical hover:bg-critical/20",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-[13px]",
      lg: "px-6 py-3 text-[14px]",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
export type { ButtonProps }
