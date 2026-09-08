// meow wordmark. Plain text in the display face at 800, primary ink, no
// gradient. Two earlier identities left their fonts hardcoded here after the
// faces themselves stopped being loaded, and the mark silently fell back to
// system-ui both times, so it now reads the family from the token only.

import type { CSSProperties, ElementType } from "react"

interface MeowWordmarkProps {
  size?: number | string
  className?: string
  as?: ElementType
  style?: CSSProperties
}

export function MeowWordmark({
  size = 24,
  className,
  as: Tag = "span",
  style,
}: MeowWordmarkProps) {
  const fontSize = typeof size === "number" ? `${size}px` : size
  return (
    <Tag
      className={className}
      style={{
        fontFamily: "var(--font-wordmark)",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        fontSize,
        color: "var(--color-text-primary)",
        display: "inline-block",
        ...style,
      }}
    >
      meow
    </Tag>
  )
}
