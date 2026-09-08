# Addendum: Figma Design Workflow (added after the initial code redesign)

This is a new, additive phase — not a redo of what's already shipped. The HAUS-palette redesign that's already rolled across the codebase (typecheck/build/lint passing per the last recap) stays as-is. **Do not modify any application code as part of this addendum** unless I explicitly ask you to pull something back from Figma into the codebase as a separate follow-up task. This phase's deliverable lives in Figma, not in the repo's source files.

Merge this whole addendum into the repo's existing `DESIGN.md`/`MASTER.md` as a new major section — append it, don't overwrite anything already in there. You wrote that file's actual current structure, so fold this in wherever it fits best; the content below is what needs to be present somewhere in it.

---

## Why Figma, and what changes

I've connected a Figma MCP server to this Claude Code session. From here on, before building or refining any screen, design it in Figma first — brand board before screens, always — so I can see and approve the direction visually before it becomes code. This is an exploratory design track that runs in parallel with the codebase, not a replacement build process.

## Setup check (do this first)

1. Confirm the Figma MCP server is actually connected: run `/plugin`, check the Installed tab, confirm `figma` shows as connected. If it's not connected, stop and tell me rather than trying to design blind.
2. Prefer the remote MCP server (`mcp.figma.com`) over the desktop variant if both are available — it supports the broadest feature set, including writing/creating native Figma content (frames, components, variables, auto layout), not just reading existing designs. Canvas-writing is currently a beta capability — expect some roughness, and after every write, verify what actually landed in the file (describe it back to me or have me open Figma and look) rather than assuming the write succeeded cleanly.
3. This is a two-way capability: it can also read existing Figma frames/links and turn them into code (design-to-code). We're using it for the opposite direction here — build the design in Figma from our design system, then bring specific pieces into code deliberately, one at a time, once I've approved them. Don't try to round-trip everything in one shot.

## Figma file & folder organization — set this up before designing anything

Keep it deliberately organized from the start so I can navigate back into it later without hunting. Structure:

**A dedicated Figma project called "Meow"**, containing separate files by concern rather than one giant file:

1. **`Meow — Foundations`** — the single source of truth. This file holds the brand board (see below) and nothing else gets designed until this file exists and I've signed off on it.
2. **`Meow — Components`** — reusable UI components (buttons, cards, nav, inputs, modals, states) built against the tokens defined in Foundations. Keep this separate from Foundations itself so the tokens stay authoritative and components stay swappable.
3. **`Meow — Screens`** (or one file per major feature area if the app is big enough that a single file gets unwieldy — use judgment here, but don't cram everything into one file just because it's easier to start that way).

**Page structure within each file** (adapt this, don't skip it):

- `Cover` — a thumbnail/summary page so the file is identifiable at a glance from the project list.
- `🔍 Visual research` — the actual reference images from `design-reference/` (hero references, hero layouts, the HAUS palette image, the alternates) pasted in for context, not just described in text.
- `🎨 Foundations` (Foundations file only) — the brand board itself.
- `🧩 Components` (Components file only) — one page per component category if it grows large (e.g., `Buttons & Inputs`, `Navigation`, `Cards & Content`), otherwise one page with clear frame groupings.
- `📱 Screens — [feature name]` (Screens file(s)) — one page per feature/flow, not one page for the whole app.
- `🔀 Flow` — connected/prototyped click-throughs once individual screens exist, for reviewing the actual navigation experience.
- `✅ Ready for dev` — final, signed-off frames only, moved here once approved, so "what's actually done" is never ambiguous.

**Naming conventions:**
- Consistent prefixes across files/pages: `Meow — <thing>`, not ad hoc names.
- No version-number-in-the-name clutter (`v2-final-copy-2`, etc.) — use Figma's actual version history for that instead.
- Arrow notation for hierarchy where useful within names (e.g., `Onboarding → Sign in`).
- Emoji prefixes are fine on page tabs only, purely for human scannability in the file browser — never on layer/component names (developers and Code Connect hand-off tooling don't want them there), and never as a suggestion that emoji belong in the actual product UI — that's still banned per the anti-slop checklist in the main brief.

## Step 1 (mandatory, before anything else): build the brand board

Build this in `Meow — Foundations`, on its own `🎨 Foundations` page, as an actual visual board — not a text document pretending to be one. It needs to restate, visually, everything already locked in the main `DESIGN.md`/`MASTER.md`, plus enough detail that a screen can be designed by referencing this board alone, without re-explaining the system each time:

- **Color**: the full HAUS-derived token system (not just the 5 raw swatches) — every surface elevation level, the primary/secondary accents, semantic colors (success/error/warning/info), and any light-mode neutral derived per the main brief. Show each as a labeled swatch with its hex and its role (e.g., "surface/base", "accent/primary", "text/on-dark").
- **Typography**: the exact display and body typefaces chosen (from the approved font list), shown at every size in the actual type scale, with weight labels — not just the font name in a paragraph.
- **Spacing & layout**: the base unit and its multiples, shown as an actual visual ruler/grid, plus the radius scale and shadow/elevation treatments as rendered swatches, not descriptions.
- **Motion reference**: a short note or reference frame on easing/duration conventions from the motion pass already done in code, so Figma-side prototypes stay consistent with what's actually shipped.
- **An explicit "do not use" panel, on the board itself**: restate the anti-slop checklist from the main brief directly on this page (or at minimum the items most relevant to visual layout — harsh gradients, bento grids, purple-and-black, sparkle icons, generic drop shadows, pure white backgrounds, etc.). Silence defaults to generic — putting the "don't" list physically on the board keeps it in view for every future prompt against this file, not just this one.
- **Personality notes**: 3–5 adjectives for the mood (e.g., considered, editorial, a little moody, tactile/grainy) plus a couple of the actual reference images from `design-reference/` pinned to the research page so the *feel*, not just the tokens, transfers.

**Checkpoint:** once the brand board exists, stop and show it to me (screenshot, or tell me to open the Figma file) before designing a single screen. Don't proceed to Components or Screens until I approve it — same rule as the checkpoint in the main brief, and for the same reason: fixing the foundation after screens exist is expensive; fixing it before is free.

## Step 2: components, then screens — one at a time, selection-based

Once the brand board is approved:
- Build the `Meow — Components` file next, referencing the Foundations tokens explicitly (link back to the brand board frame/file in each prompt rather than re-describing colors/type from memory).
- Then move to individual screens in `Meow — Screens`, one screen or one small flow at a time — not a whole-app pass in one go. Use selection-based work: have a specific frame in view, ask for a specific change, review it, then move to the next. Figma-canvas writes aren't reliably tweakable after the fact the same way code is — a big multi-screen attempt in one shot tends to compound small drift into a mess that's expensive to unwind.
- Every prompt in this phase should point back at the Foundations file rather than re-stating the system in prose — that's the whole point of building it first.

## Guardrails specific to this phase

- Don't treat anything designed in Figma as automatically shipped. Nothing here changes app code until I explicitly ask for a specific piece to be pulled back into the codebase.
- Re-verify Figma writes after they happen — describe back what was created, or ask me to look, rather than assuming the beta write capability landed exactly as intended.
- If a screen in Figma ends up wanting a token, spacing value, or pattern that isn't in the Foundations board yet, stop and add it to Foundations first (with my sign-off) rather than inventing an off-system one-off value directly on a screen.
