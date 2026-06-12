// Polished, deliberate placeholder for events with no cover asset.
//
// Two layers stacked with intent:
//   1. An outer wrapper painted with a metallic gradient (white → violet → ink)
//      and 1px of padding. That gradient becomes the visible hairline stroke.
//   2. An inner `#1A102F` plate carrying the typography and a soft radial
//      glow. The plate sits inside the stroke so the gradient never feels
//      like a separate border element — it reads as one engineered material.
//
// No emoji, no clip-art, no rainbow gradient. The month sits in tight tracked
// uppercase above an oversized day glyph in Sora ExtraBold, lit by a barely-
// visible purple bloom. Polished, not loud.

interface DateThumbProps {
  startDate: Date | string
  /** Used only to deterministically hue a hash-gradient when the date is invalid. */
  title?: string
  /** Tailwind rounding to match the parent thumbnail wrapper. */
  className?: string
}

export function DateThumb({ startDate, title = "", className = "rounded-xl" }: DateThumbProps) {
  const d = typeof startDate === "string" ? new Date(startDate) : startDate
  const valid = !isNaN(d.getTime())

  // Invalid date fallback — title-hashed monochrome plate so each event still
  // gets a distinct visual fingerprint without flashing rainbow.
  if (!valid) {
    let h = 0
    for (let i = 0; i < title.length; i++) h = ((h << 5) - h) + title.charCodeAt(i)
    const hue = Math.abs(h) % 360
    return (
      <div
        className={`w-full h-full ${className}`}
        style={{
          background: `linear-gradient(155deg, hsl(${hue}, 32%, 18%) 0%, #11111f 100%)`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        aria-hidden="true"
      />
    )
  }

  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const day = d.getDate()

  return (
    // OUTER: paints the metallic hairline stroke via 1px of gradient padding.
    <div
      className={`w-full h-full ${className} p-px`}
      style={{ background: "var(--gradient-metal)" }}
      aria-hidden="true"
    >
      {/* INNER: the actual plate. Inherits rounding via the same class so
          the gradient stroke hugs the corners cleanly. */}
      <div
        className={`relative w-full h-full ${className} flex flex-col items-center justify-center select-none overflow-hidden`}
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, #221542 0%, #1A102F 45%, #0F0820 100%)",
        }}
      >
        {/* Soft violet bloom behind the day glyph */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(55% 45% at 50% 58%, rgba(168, 132, 255, 0.22), transparent 70%)",
          }}
        />

        {/* Fine top-left/bottom-right specular hint — sells the metallic edge */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.18) 100%)",
          }}
        />

        <span
          className="relative font-display text-[10px] font-semibold tracking-[0.28em] text-purple-light/80"
          style={{ textShadow: "0 0 8px rgba(168,132,255,0.25)" }}
        >
          {month}
        </span>

        <span
          className="relative font-display font-extrabold text-text-primary leading-none mt-1 tabular-nums"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            textShadow: "0 0 18px rgba(168,132,255,0.45)",
            letterSpacing: "-0.04em",
          }}
        >
          {day}
        </span>
      </div>
    </div>
  )
}
