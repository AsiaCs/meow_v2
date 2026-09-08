import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
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
    // Buttons are 8px, not pills. The previous system rounded every control
    // fully; this direction is tighter and more architectural, and the radius
    // is the main thing carrying that.
    //
    // Primary is near-black rather than the accent. Keeping the accent OFF the
    // main CTA is what lets it stay an accent: its whole surface is links,
    // focus rings and one hover state.
    const base =
      "inline-flex items-center justify-center gap-2 rounded-control font-medium " +
      "transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)] " +
      "disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
      primary: "bg-bg-inverse text-text-inverse hover:bg-neutral-800",
      // A faint tint rather than a heavy border. Section 2c: no heavy borders
      // on the secondary style.
      secondary:
        "bg-bg-raised text-text-primary border border-border-subtle hover:bg-bg-sunken",
      ghost: "bg-transparent text-text-secondary hover:bg-bg-raised hover:text-text-primary",
      danger: "bg-transparent text-critical border border-border-subtle hover:bg-bg-raised",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-meta min-h-8",
      md: "px-4 py-2 text-ui min-h-[38px]",
      lg: "px-5 py-2.5 text-ui min-h-11",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
export type { ButtonProps }
