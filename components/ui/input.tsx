import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  requiredMark?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, requiredMark, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    const errorId = error && inputId ? `${inputId}-error` : undefined
    const hintId = hint && inputId ? `${inputId}-hint` : undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-ui font-medium text-text-secondary">
            {label}
            {requiredMark && (
              <>
                <span aria-hidden="true" className="text-critical ml-1">*</span>
                <span className="sr-only"> (required)</span>
              </>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            // border-field, not border-subtle. On an input the border IS the
            // control boundary, so it has to clear 3:1 per WCAG 1.4.11.
            // border-subtle is a decorative separator and measures 1.20:1.
            "bg-bg-base border border-border-field rounded-control",
            "px-3 py-2 min-h-[38px] text-body text-text-primary",
            "placeholder:text-text-disabled",
            // The focus ring is global and token-driven. Do not add one here.
            "focus:outline-none focus:border-text-primary",
            "transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-critical focus:border-critical",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-meta text-critical">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-meta text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
export type { InputProps }
