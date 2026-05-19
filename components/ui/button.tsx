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
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40"

    const variants = {
      primary:
        "text-white shadow-lg shadow-purple/20",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
      outline:
        "border border-border-strong text-text-primary hover:bg-white/[0.04] bg-transparent",
      danger:
        "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3.5 text-base",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        style={
          variant === "primary"
            ? { background: "var(--gradient-brand)" }
            : undefined
        }
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
