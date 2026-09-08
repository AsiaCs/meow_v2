# DESIGN.md — meow

> An index of AI events and internships. Light, quiet, almost entirely grayscale.
> Scale and whitespace do the work; nothing decorative is load-bearing.

Design constitution for AI coding agents working in this repo. The previous direction
is preserved in `DESIGN-haus-archive.md` — it was a legitimate system that took real
work, and reading it explains why several structural decisions here look the way they do.

---

## Identity

meow indexes AI and tech networking events and internships, re-read from Luma and
Cerebral Valley every 30 minutes, filtered to your city. The audience is early-career
technical people trying to show up to things.

The register is **quiet utility**. The product's asset is that the listings are real and
current, so the design shows listings and gets out of the way. A minimal system is easy
to make generic by accident; precision in spacing and restraint in decoration is the
whole difference between "clean" and "empty template".

Voice: plain, specific, slightly dry. It says what is true, including when the feed is
broken. It does not sell.

---

## Colour

Grayscale carries almost the entire UI. Two anchors are verified real values, not
invented:

```
#FAFAF9  the ground.  An off-white, never pure #fff.
#100F0C  the ink.     An off-black, never pure #000.
```

Both are warm-tinted, so the neutral ramp between them is warm too. A pure grey ramp
reads cold against these anchors, and that mismatch is the tell that separates a
considered neutral from an inherited one.

Never write a hex in a component. Every colour is a semantic token in `app/globals.css`.

### The accent

**`#9E4257`, a deep rose. One accent, used sparingly.**

Its entire surface is links, focus rings, and one hover state. The primary button is
near-black, **not** the accent — keeping the accent off the main CTA is what lets it stay
an accent. If a screen shows rose in four places, three of them are wrong.

### Measured, not assumed

Worst case across **all three surfaces**, not just the ground:

| Token | Value | Worst case | |
|---|---|---|---|
| `text-primary` | `#100F0C` | 15.24:1 | AA + AAA |
| `text-secondary` | `#44403B` | 8.17:1 | AA |
| `text-muted` | `#6D665D` | 4.50:1 | AA |
| `accent` | `#9E4257` | 5.97:1 | AA |
| `border-field` | `#95918B` | 3.00:1 | AA for a control boundary |
| `text-disabled` | `#A8A29B` | 2.01:1 | Below on purpose, WCAG 1.4.3 exempts inactive controls |

**Validate against every surface, not just `bg-base`.** The first pass of this palette
checked muted against the ground only and shipped a tier measuring 3.82:1 on the sunken
surface — a real AA failure that a spot-check would have missed. If you introduce a
colour, compute it against `bg-base`, `bg-raised` and `bg-sunken`.

Three ink tiers that all pass but look identical are not a ramp. Keep at least ~1.8:1
between adjacent tiers.

### Two border tokens that are not interchangeable

- `border-subtle` and `border-default` are **decorative separators**. They sit under 3:1
  on purpose because they divide rather than define.
- `border-field` is a **control boundary**. On an input the border is the only thing
  telling you where the control is, so it clears 3:1 per WCAG 1.4.11.

Using `border-subtle` on an input is an accessibility bug, not a style choice.

Status colours always pair with a label or a glyph. Colour alone never carries meaning.

---

## Type

**Inter, everywhere.** Headings and body, one family.

Inter is the single most common default-AI typeface, which is exactly why it needs
handling. What makes it deliberate rather than lazy:

- **Weights stop at 600.** Headings sit at 500, even at 48px. No `font-bold`, no
  `font-extrabold`. The restraint is most of the effect.
- **Tracking tightens as size grows** and opens at body size: `-5%` at display, `+1.25%`
  at body. One tracking value everywhere is what makes Inter read generic.
- **Leading opens as size shrinks**: 100% at display, 150% at body.
- Scale and whitespace carry the impression, not the typeface.

| Step | Size | Weight | Tracking | Leading |
|---|---|---|---|---|
| `text-display` | 48px | 500 | -5% | 100% |
| `text-heading-l` | 32px | 500 | -3.2% | 108% |
| `text-heading-m` | 24px | 500 | -2.5% | 112% |
| `text-lead` | 20px | 400 | +1% | 140% |
| `text-body` | 16px | 400 | +1.25% | 150% |
| `text-ui` | 14px | 400 | +0.5% | 135% |
| `text-meta` | 13px | 400 | +1% | 140% |

**`text-[15px]` is a bug.** So is `text-sm`. Use the scale.

Numerals align via `tabular-nums`, already applied to `<time>` and `[data-numeric]`.

---

## Space and shape

Three radii, and only three:

| Utility | Value | Applies to |
|---|---|---|
| `rounded-control` | 8px | buttons, inputs, chips, nested elements |
| `rounded-panel` | 12px | cards, sheets, sidebar, containers |
| `rounded-frame` | 16px | the hero visual frame |

Tighter than the previous system, which was softer than this direction calls for.
Anything outside these three is a bug. Badges are the one documented exception at 6px.

**Hairlines, not shadows.** Two shadow tokens exist and both are nearly invisible.
Dramatic elevation is a default-AI tell and in a light system it reads as dirt on the
page. Depth comes from the surface ladder and `border-subtle`.

**Err toward more whitespace than feels necessary.** This system should feel spacious.
Page container is `max-w-[1180px] mx-auto` with `px-4 sm:px-6`.

---

## Mode

**Light-only.** This is a decision, not an omission.

The previous system carried light and dark because that palette was dark by nature. This
one is light by nature, and a dark variant would either reintroduce the retired mood or
invent a second identity nobody asked for. The `color-scheme` and token structure are in
place so adding one later does not require restructuring.

---

## Motion

Quieter than the previous system. A minimal system earns its calm by not moving much.

- Prefer the CSS classes `.enter` and `.enter-row` with `style={{ '--i': n }}` for
  stagger. They use `@starting-style`, so the resting state is the visible state and a
  failed animation degrades to no animation rather than to no content. This matters: an
  earlier revision server-rendered the hero at `opacity: 0` behind `requestAnimationFrame`
  and it stayed invisible in backgrounded tabs.
- Frequency gate: the more often a user sees an animation, the shorter it must be.
- **Every JS-driven animation must branch on `useReducedMotion()` itself.** The global CSS
  backstop only reaches CSS transitions, not a framer-motion transform.
- Animate `transform` and `opacity`. Never `top`/`left`/`width`/`height`.
- Never `window.addEventListener("scroll")`. Use an IntersectionObserver on a sentinel.

---

## Components

- **Icons: Phosphor only**, one weight per context. Server components must import from
  `@phosphor-icons/react/dist/ssr` — the main entry is a client component and breaks
  static generation. `lucide-react` has no importers and can be dropped from
  `package.json`.
- **Button** has four variants: `primary` (near-black), `secondary` (faint tint, hairline),
  `ghost`, `danger`. No `outline` — that was the previous system.
- **Cards only when elevation means something.** Group with `border-t`, `divide-y`, or
  space first.
- **Every interactive element needs all its states**: hover, `focus-visible`, disabled,
  loading, error, empty. Loading means a skeleton shaped like the real content.
- **Focus rings are global and token-driven. Never override them per component.** Four
  components in the previous system did exactly that with a low-alpha ring utility that
  could not clear 3:1, and it was invisible until measured.
- Tap targets: 44px minimum on anything primary.

---

## Copy

- **No em dashes.** Not in headlines, labels, buttons, body, alt text, or page titles.
  Use a comma, a period, or a colon.
- One label per CTA intent across the whole page.
- No fabricated social proof. The landing page's trust row shows **live city counts**
  precisely because meow has no customer logos and inventing them would be fake
  testimonials by another name.
- No section-numbering micro-meta, no scroll cues, no fake precision.
- The middot separator is rationed to one per line.
- Say the true thing. When the feed is empty, the copy says the feed is broken.

---

## Accessibility

Non-negotiable outputs, not polish:

- WCAG **AA** for all text, verified against every surface it can sit on.
- Visible `:focus-visible` on everything interactive. Never `outline: none` alone.
- `prefers-reduced-motion` respected in both CSS and JS.
- A skip link into the main landmark on every page.
- `aria-current` on active nav items. Icon-only buttons get `aria-label`.

---

## Still true from the previous direction

The anti-slop checklist carries over in full, and a few items matter *more* in a minimal
system because it is so easy to make generic by accident: no reflexive bento grids, no
purple-and-black, no sparkle icons, no fake testimonials, no generic drop shadows, no
pure white or pure black, no checkmark-bullets as a default list, no three-cards-in-a-row
as a lazy layout.

The one sanctioned gradient is the hero visual's backdrop. It is decorative art behind a
product shot, not a UI surface, which is why it does not contradict the rule.

---

## Known gaps

- **The seven auth-gated screens have still never been viewed in a browser.** Dashboard,
  events, event detail, internships, onboarding, submit, profile. They typecheck, build,
  and use only system tokens, but no one has seen them rendered. The Chrome extension has
  not connected across three attempts.
- **bird.com's real card, table and form patterns were never studied** — only its
  homepage. The component shapes here are derived from the brief's description, which
  the brief itself flagged as non-exhaustive.
