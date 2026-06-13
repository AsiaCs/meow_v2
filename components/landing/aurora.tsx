// Aurora background — northern-lights ribbons in the meow logo spectrum.
// Pure CSS animation; sits as the visual identity behind the hero.
//
// Implementation matches the meow-ds.css handoff verbatim. The four blobs
// drift on independent long loops (24–33s) using transform + opacity only,
// so the GPU compositor handles everything off the main thread.
//
// Lives next to other landing decorations and is mounted ONCE at the top
// of the marketing page (not per-section) — the aurora is the background
// for the whole landing, not a per-section accent.

export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="au au1" />
      <span className="au au2" />
      <span className="au au3" />
      <span className="au au4" />
    </div>
  )
}

// Room — meow-ds canonical canvas wash. Soft radial bloom from the top
// over a vertical gradient. Pair it with <Aurora /> so the aurora's
// transparency reads against a proper depth field, not flat black.
export function Room() {
  return <div className="bg-room" aria-hidden="true" />
}
