// meow — icon + wordmark lockup. Use this anywhere you want the brand
// pair: sidebar, landing nav, footer, auth header, etc.

import { MeowLogo } from "./meow-logo"
import { MeowWordmark } from "./meow-wordmark"

interface MeowLockupProps {
  iconSize?: number
  wordmarkSize?: number
  gap?: number
  className?: string
  iconTone?: "dark" | "light"
  /** Vertical stack (icon on top of wordmark) instead of side-by-side. */
  stacked?: boolean
}

export function MeowLockup({
  iconSize = 28,
  wordmarkSize,
  gap = 10,
  className,
  iconTone = "dark",
  stacked = false,
}: MeowLockupProps) {
  // When wordmark size isn't set, derive it from icon size so the pair
  // always feels proportional. Roughly 0.85x icon height matches the
  // handoff lockups.
  const wmSize = wordmarkSize ?? Math.round(iconSize * 0.85)

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexDirection: stacked ? "column" : "row",
        gap: `${gap}px`,
        lineHeight: 1,
      }}
    >
      <MeowLogo size={iconSize} tone={iconTone} />
      <MeowWordmark size={wmSize} />
    </span>
  )
}
