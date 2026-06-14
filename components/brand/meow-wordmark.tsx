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

// Perplexity pivot — wordmark is now plain text. No gradient,
// no Poppins; uses the sans face (Urbanist) at bold weight in primary ink.
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
          "var(--font-urbanist), 'Urbanist', system-ui, sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.02em",
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
