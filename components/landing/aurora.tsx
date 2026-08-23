// RETIRED — kept as no-op exports so the three call sites still compile
// until they are rebuilt.
//
// The aurora was six blurred radial blobs in mint / purple / cyan / pink /
// indigo drifting on 24–35s loops behind the hero, plus a radial "room" wash.
// That is two of the banned patterns at once — decorative radial orbs and
// rainbow colour — and it was also permanently animated peripheral motion,
// which HIG's Reduce Motion guidance explicitly calls out ("reduce automatic
// and repetitive animations, including zooming, scaling, and peripheral
// motion").
//
// Depth in the rebuilt system comes from the base/elevated surface ladder and
// hairlines, not from ambient glow. Delete this file once the landing page,
// the (app) layout and the sign-in page no longer import it.

export function Aurora() {
  return null
}

export function Room() {
  return null
}
