# DESIGN.md — meow

> An index of AI events and internships. Dark, grainy, editorial. The data is the
> visual; decoration is what you add when you have nothing to show.

Design constitution for AI coding agents working in this repo. `design-system/meow/MASTER.md`
carries the generated system and the full rationale. This file is the short version:
what to do, and what not to.

---

## Identity

meow indexes AI and tech networking events and internships, re-read from Luma and
Cerebral Valley every 30 minutes, filtered to your city. The audience is early-career
technical people who are trying to show up to things.

The register is **editorial index**, not marketing site. A printed listings page:
hairlines, tabular figures, real dates, honest empty states. The product's genuine
asset is that the listings are real and current, so the design shows listings rather
than illustrations of listings.

Voice: plain, specific, slightly dry. It says what is true, including when the feed is
broken. It does not sell.

---

## Colour

Palette is **"Let's Be Thinkers" (HAUS)**, locked. Dark is the default; light is a
derived translation.

```
#1C3334  deep teal-black    base surfaces
#2F4454  slate blue-gray    secondary surfaces
#2E151B  deep maroon-black  deepest surface, and ink on rose
#DA7B93  dusty rose         PRIMARY ACCENT
#376E6F  muted teal         secondary accent, fills only
```

Never write a hex in a component. Every colour is a semantic token in `app/globals.css`.

**Three rules that are not negotiable, because they are measurements:**

1. **No white on rose.** `#FFF` on `#DA7B93` is 2.90:1. Labels on a rose fill use
   `text-on-brand` (the maroon, 5.84:1). Use `.btn-brand` and this is handled.
2. **Teal is never text.** 2.00:1 against the rose, under 3:1 against every base.
   `bg-accent-2`, `border-accent-2`. Never `text-accent-2`.
3. **Surfaces do not separate by fill.** The dark swatches are within 1.67:1 of each
   other. Use `border-border` between things. Shadows are for modals and sheets only;
   `--shadow-card` is `none` by design.

The rose is the primary accent and it is used **deliberately, not everywhere**. Roughly:
the primary CTA, the active state, one hover colour. If a screen has rose in five
places, four of them are wrong.

`text-brand` is the raw swatch, for large type and fills. `text-brand-text` is the
text-safe sibling, for anything body-sized. They are not interchangeable.

Status colours always pair with a label or a glyph. Colour alone never carries meaning.

---

## Type

| Use | Class | Face |
|---|---|---|
| Display, headlines, wordmark | `font-display` | Sora |
| Everything else, including numerals | `font-sans` (default) | Public Sans |

There is no mono face. Numerals align via `tabular-nums`, which is already applied to
`<time>` and anything with `[data-numeric]`.

Use the scale: `text-display-xl` `text-display-l` `text-display-m` `text-heading-l`
`text-heading-m` `text-body-l` `text-body-m` `text-label` `text-meta`.
**`text-[15px]` is a bug.** There were 58 of them; do not add the 59th.

Emphasis inside a headline is `.u-emphasis`: italic, same family. Do not drop a serif
word into a sans headline.

---

## Space and shape

Three radii, and only three:

| Utility | Value | Applies to |
|---|---|---|
| `rounded-pill` | 999px | buttons, chips, tabs |
| `rounded-panel` | 14px | cards, inputs, sheets, sidebar |
| `rounded-inset` | 8px | nested inside a panel; the focus ring |

These come from the `--radius-*` namespace in the `@theme` block, which Tailwind v4
turns into `rounded-<name>` utilities. Do not write `rounded-[14px]` or `rounded-xl`.

Page container is `max-w-[1240px] mx-auto px-6`. Sections separate with
`border-b border-border`, not with background changes.

---

## Motion

Dial: **4/10**. Entrances and hovers, one scroll sequence, nothing choreographed.

- Prefer the CSS classes `.enter` and `.enter-row` with `style={{ '--i': n }}` for
  stagger. They use `@starting-style`, so the resting state is the visible state and a
  failed animation degrades to no animation rather than to no content. This matters:
  an earlier revision server-rendered the hero at `opacity: 0` behind
  `requestAnimationFrame` and it stayed invisible in backgrounded tabs.
- Frequency gate: the more often a user sees an animation, the shorter and subtler it
  must be. A row hover is 200ms. A once-per-session moment can afford more.
- **Every JS-driven animation must branch on `useReducedMotion()` itself.** The global
  CSS backstop in `globals.css` only reaches CSS transitions. It does not reach a
  framer-motion transform.
- Animate `transform` and `opacity`. Never `top`/`left`/`width`/`height`.

---

## Components

- **Icons: Phosphor only**, one weight per context. `lucide-react` has zero importers
  left; it is still listed in `package.json` and can be dropped. Do not add it back.
  Server components must import from `@phosphor-icons/react/dist/ssr` — the package's
  main entry is a client component and breaks static generation.
- **Cards only when elevation means something.** Group with `border-t`, `divide-y`, or
  space first. The audit's finding was that boxing everything produced a uniform
  rounded-rectangle texture with no hierarchy in it.
- **Every interactive element needs all its states**: hover, `focus-visible`, disabled,
  loading, error, empty. Loading means a skeleton shaped like the real content, not a
  spinner and not nothing.
- Focus rings are global and token-driven. Do not override them per component.
- Tap targets: 44px minimum.

---

## Copy

- **No em dashes.** Not in headlines, labels, buttons, body, alt text, or page titles.
  Use a comma, a period, or a colon. The audit found roughly twenty in shipped strings.
- One label per CTA intent across the whole page. "Sign in" and "Get started" and
  "Create your account" are one intent wearing three hats.
- At most one uppercase tracked eyebrow per three sections. There were thirteen across
  six sections.
- No section-numbering micro-meta (`№ 999 / Colophon`, `001 · Capabilities`), no scroll
  cues, no fake precision, no invented testimonials.
- The middot separator is rationed to one per line.
- Say the true thing. When the feed is empty, the copy says the feed is broken.

---

## Accessibility

Non-negotiable outputs, not polish:

- WCAG **AA** for all text. The token ramp is pre-verified; if you introduce a colour,
  measure it.
- Visible `:focus-visible` on everything interactive. Never `outline: none` alone.
- `prefers-reduced-motion` respected in both CSS and JS.
- A skip link into the main landmark on every page.
- `aria-current` on active nav items. Icon-only buttons get `aria-label`.
- Both colour schemes work. Do not ship a screen you have only viewed in one.

---

## Cleared

The Phase 3 sweep closed all of this. Listed so a later session can tell a
deliberate decision from an oversight:

1. **Icons.** All 18 Lucide files moved to Phosphor; `lucide-react` has no importers
   left. Server components import from `@phosphor-icons/react/dist/ssr`, because the
   package's main entry is client-only and breaks static generation.
2. **Token shims.** The `brand-hi` / `text-faint` / `font-mono` / `shadow-card` aliases
   are deleted. Nothing references them.
3. **Scale drift.** 58 arbitrary `text-[Npx]` values and 16 radii are gone. Every size
   is on the scale, every corner is one of the three radii.
4. **Badge.** Variants are now `neutral` / `accent` / `positive` / `critical` /
   `outline`. No caller names a colour.
5. **Loading states.** Eight route-level `loading.tsx` files, each mirroring the real
   layout it replaces, built from `components/ui/skeleton.tsx`.
6. **Copy.** No em dashes in any visible string.
7. **Focus.** Four components were overriding the global ring with a 1px 20%-alpha
   `ring-*` utility, which outranks the zero-specificity `:where()` global rule. They
   now defer to it.
8. **Motion.** Every JS-driven animation branches on `useReducedMotion()`. The nav's
   `window.addEventListener("scroll")` is replaced by an IntersectionObserver on a
   sentinel.
9. **Landmarks.** Skip links on both the marketing page and the app shell;
   `aria-current="page"` on the sidebar and mobile tab bar.

Two hand-rolled SVGs remain on purpose: the Google mark on `/auth/signin` and the
Google/Outlook marks in `add-to-calendar.tsx`. Third-party brand logos are the one
case an icon library cannot cover, and substituting them would be wrong.


---

## Figma design track

Added after the code redesign shipped. This is an **additive, exploratory track that
runs in parallel with the codebase**, not a replacement build process and not a redo of
what is already in `app/`. Nothing designed in Figma changes application code until it
is explicitly asked for, one piece at a time.

**The rule: brand board before screens, always.** Design a surface in Figma and get it
approved before it becomes code, so the direction can be seen and judged visually first.

### Files

A dedicated Figma project, **Meow**, split by concern rather than one large file:

| File | Holds | Gate |
|---|---|---|
| `Meow — Foundations` | The brand board. The single source of truth. | Nothing else is designed until this exists and is signed off |
| `Meow — Components` | Reusable UI built against Foundations tokens | After Foundations is approved |
| `Meow — Screens` | Screens and flows, one file per feature area if it grows unwieldy | After Components |

Components stay out of Foundations so the tokens remain authoritative and the components
stay swappable.

### Pages within a file

- `Cover` — thumbnail and summary, so the file is identifiable from the project list
- `🔍 Visual research` — the actual images from `design-reference/`, pasted in, not described
- `🎨 Foundations` — the brand board (Foundations file only)
- `🧩 Components` — one page per category once it grows (`Buttons & Inputs`, `Navigation`, `Cards & Content`)
- `📱 Screens — [feature]` — one page per feature or flow, never one page for the whole app
- `🔀 Flow` — prototyped click-throughs, once individual screens exist
- `✅ Ready for dev` — signed-off frames only, so "done" is never ambiguous

### Naming

- `Meow — <thing>` everywhere. No ad hoc names.
- No version numbers in names (`v2-final-copy-2`). Figma's version history does that job.
- Arrow notation for hierarchy where it helps: `Onboarding → Sign in`.
- **Emoji on page tabs only.** Never on layer or component names, where hand-off tooling
  and Code Connect have to read them. This is a file-browser affordance and is not a
  softening of the product rule: emoji stay banned in the actual UI.

### What the brand board must carry

Enough that a screen can be designed by referencing the board alone:

- **Colour** — the full derived token system, not the five raw swatches. Every surface
  elevation, both accents, the semantics, the light-mode neutrals. Each a labelled
  swatch with hex and role (`surface/base`, `accent/primary`, `text/on-dark`).
- **Typography** — Sora and Public Sans rendered at every step of the real scale, with
  weight labels. Not the font name in a paragraph.
- **Spacing and layout** — the base unit and its multiples as a visual ruler, plus the
  three radii and the elevation treatments as rendered swatches.
- **Motion** — the easing and duration conventions from the shipped code, so Figma
  prototypes do not drift from what actually ships.
- **A "do not use" panel, physically on the board.** The anti-slop list from this file
  restated on the canvas. Silence defaults to generic; keeping the list in view keeps it
  in every future prompt made against the file, not just the first one.
- **Personality** — three to five mood adjectives, plus real reference images pinned to
  the research page so the feel transfers and not only the tokens.

### Working rules for this phase

- **Selection-based, one frame at a time.** A whole-app pass in one shot compounds small
  drift into something expensive to unwind, because canvas writes are not tweakable
  after the fact the way code is.
- **Point prompts at the Foundations file** rather than restating the system in prose.
  That is the entire reason for building it first.
- **Verify every write.** Canvas writing is a beta capability. Describe back what landed,
  or have it opened and looked at, rather than assuming the write was clean.
- **A screen that wants an off-system value is a Foundations bug.** Stop, add the token
  to the board with sign-off, then use it. Never invent a one-off value on a screen.
