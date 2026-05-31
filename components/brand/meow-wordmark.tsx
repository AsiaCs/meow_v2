// meow — wordmark in Poppins ExtraBold with the pink → fuchsia → purple
// gradient specified in the v2 logo handoff.
//
// Spec: linear-gradient(95deg, #f472b6, #d946ef 45%, #a855f7)

import type { CSSProperties, ElementType } from "react"

interface MeowWordmarkProps {
  size?: number | string
  className?: string
  as?: ElementType
  style?: CSSProperties
}

const WORDMARK_GRADIENT = "linear-gradient(95deg, #f472b6, #d946ef 45%, #a855f7)"

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
        fontFamily:
          "var(--font-poppins), 'Poppins', ui-sans-serif, system-ui, sans-serif",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontSize,
        backgroundImage: WORDMARK_GRADIENT,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        display: "inline-block",
        ...style,
      }}
    >
      meow
    </Tag>
  )
}
