# Meow — UI Redesign Build Brief for Claude Code

You are redesigning the UI of my app, **meow**, inside this repo. This is a real, in-place redesign of a working product — not a mockup and not a rebuild from scratch. Read this entire brief before touching any code. It contains: the ground rules, the four design skills/repos you need to install and use, the actual visual research I've compiled (color palettes, an approved font list, layout references, and a checklist of "AI slop" patterns to avoid), and the phased plan to execute against.

**Setup required before you start:** a `design-reference/` folder (hero-references/, hero-layouts/, color-palettes/, plus a README) has been placed at the repo root next to this brief. Section 4 tells you exactly which file to open for which phase — actually look at them, don't rely on the text descriptions alone. If you don't see that folder at the repo root, stop and ask for it before doing the Phase 1 layout/color work.

---

## 0. Fill these in before you start (I'll answer inline, or you can ask me)

- **What meow does / who it's for:** _[Aaron: one or two sentences — the core action, the user, the vibe. E.g. "a cat-sitting marketplace," "a social feed for cat photos/videos," "a voice-note app that translates your cat's meows." This changes the design-system query in Phase 2 — don't skip it.]_
- **Platform:** _[web app / iOS / Android / cross-platform — if this isn't obvious from the repo, detect it in Phase 1 and confirm with me before proceeding rather than guessing.]_
- **Any brand elements that must survive as-is:** _[existing logo, existing app icon, an existing color that's become recognizable, a tagline, etc. If none, say so explicitly so I don't invent constraints.]_

## 1. Ground rules for the whole session

1. **This is `/redesign-existing-projects` territory, not a greenfield build.** Audit first, then change presentation. Do not remove or break existing functionality, routes, data-fetching, state management, or business logic. Only the visual/interaction layer is in scope: design tokens, typography, spacing, component styling, layout, motion, and markup changes strictly needed to support the new system.
2. **Never truncate output.** When editing or rewriting files, always write the complete file — no `// ... rest of code unchanged` placeholders. Treat this as a standing rule for the whole session (this is what the `full-output-enforcement` skill below exists to enforce — keep it active).
3. **Checkpoint before a full rollout.** Don't apply the new visual system to the entire app in one shot. Build the design system, apply it to one representative screen, show me (describe it / screenshot it if you have browser tooling), and get my sign-off before propagating it everywhere.
4. **Don't invent brand facts.** If something in section 0 is left blank and you can't infer it confidently from the repo (README, marketing copy, existing screens), ask me directly instead of assuming.
5. **Preserve accessibility and don't regress it.** Color contrast (WCAG AA minimum for text), visible focus states, tap target sizes, and reduced-motion support are non-negotiable outputs of this redesign, not optional polish.

## 2. Install and verify these four design resources first

These are the specific skills/references I want driving this redesign — don't substitute generic knowledge for them; actually install and invoke them.

1. **`ui-ux-pro-max`** — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
   Design-system generator with a searchable local database of patterns, palettes, and font pairings by product type — this is what keeps you off default-AI purple-gradient territory.
2. **`taste-skill`** — https://github.com/Leonxlnx/taste-skill
   A library of 12 sub-skills. The ones relevant here: `/design-taste-frontend` (audit-first, names templated/generic patterns before changing anything — use it as your second opinion), `/redesign-existing-projects` (upgrading a live app in place without breaking functionality — this is the core mode for this whole job), `/minimalist-ui` and `/high-end-visual-design` (the two aesthetic directions most likely to fit meow, see Phase 2 — do **not** default to `/industrial-brutalist-ui` or `/gpt-taste` unless the audit specifically points that way; both skew colder/more aggressive than the mood board here supports), and `/full-output-enforcement` (keep this stacked on every step per rule 1.2).
3. **`awesome-claude-design`** — https://github.com/VoltAgent/awesome-claude-design
   Not a skill — a collection of 68 curated `DESIGN.md` files (design constitutions) reverse-engineered from real products, hosted at getdesign.md. Use one only as a *structural template* for how to write meow's own `DESIGN.md` (e.g. `curl -o reference-DESIGN.md https://getdesign.md/vercel/design-md` to see the format) — don't adopt another brand's actual colors/type/voice.
4. **`design-motion-principles`** — https://github.com/kylezantos/design-motion-principles
   Motion skill with two modes: audit (emits an HTML report on existing motion) and create (grounds new motion in Emil Kowalski/restraint, Jakub Krehel/production polish, or Jhey Tompkins/playful, weighted by context). Enforces the "frequency gate" (the more often a user sees an animation, the shorter/subtler it must be) and hard-requires `prefers-reduced-motion` handling. Apply this **after** a component's static design works, as a polish pass — not before.

**Before moving on:** confirm each of these is actually installed and its slash command / script is recognized in this environment (try `/ui-ux-pro-max`, `/design-taste-frontend`, `/redesign-existing-projects`, `/design-motion-principles`). If a repo's own README specifies a different install path than cloning into `~/.claude/skills/<name>/`, follow the README. If installation fails for one of them, tell me which one and why, and proceed with the rest rather than silently skipping.

Note: `taste-skill` also includes `/image-to-code`, `/imagegen-frontend-web`, `/imagegen-frontend-mobile`, and `/brandkit`, which generate reference images before building from them — these need an image-generation MCP/tool. If none is connected in this environment, they'll degrade to text-direction only; that's fine, don't block on it.

## 3. Phase 0 — Audit (do this before any design decisions)

- Detect the actual stack (framework, styling approach — Tailwind config, CSS-in-JS, CSS modules, native styling for mobile, component library in use) so you can pass the right `--stack` value in Phase 2 and know which files own theming.
- Inventory current design tokens: is there an existing theme/tokens file, color variables, a type scale? List what exists today, even if inconsistent.
- Inventory the actual screens/components that need to change (nav, home/feed, key CTAs, forms, cards, empty states, modals, settings — whatever meow actually has).
- Note current accessibility gaps (contrast, missing focus states, tiny tap targets) so they're fixed as part of this pass, not a follow-up.
- Run `/design-taste-frontend` in **audit mode** against the current UI first. It's audit-first by design — let it name the generic/templated patterns already present before you change anything. Treat its findings as part of this audit, not a duplicate step.

## 4. Phase 1 — The actual visual research (use this, don't reinvent it)

This is compiled from the mood-board Drive folder. **A `design-reference/` folder has been placed in the repo root alongside this brief** — actually open and look at these image files with your file/image-reading tool before executing the matching section below; the written descriptions here are a fallback, not a substitute for looking:

- `design-reference/hero-references/01-immersive-uiwiki.png` through `05-flower-studio-editorial.png` → for section 4c, marketing/hero-section structure
- `design-reference/hero-layouts/01-hero-layout-a.png` through `04-hero-layout-d.png` → for section 4c, the in-app hero/card skeleton
- `design-reference/color-palettes/CHOSEN-lets-be-thinkers-haus.png` → for section 4b, look at this one directly for grain/texture/contrast feel before generating the token system, don't work from the hex codes alone
- `design-reference/color-palettes/alt-*.png` → the reference/alternate palettes in 4b, for the record only
- `design-reference/README.md` → index of the above

If this folder is missing when you get here, stop and ask me for it rather than proceeding from text alone — the layout and color phases specifically depend on you actually seeing these, not just reading about them.

### 4a. Approved font shortlist — pick from this list, don't invent fonts outside it

Distruction, Futura, Inter Tight, Satoshi, Vamos, Rosnoc, Plus Jakarta Sans, Figtree, Inter, Helvetica, Roboto, SF Pro, Mulish, Work Sans, Circular, Rethink Sans, Be Vietnam, Lexend, Nunito Sans, Sora, Aeonik Pro, Getai Grotesk, Instrument Serif, Asta Sans, Urbanist, Manrope, Outfit, Public Sans.

Pick one display/heading face and one body face (they can be the same family at different weights if that family has enough range, e.g. Satoshi or Sora). **Caveat:** Inter is on this list *and* on the "overused AI default" list in 4c — if you use it, use it deliberately (e.g., Inter for body copy only, paired with a distinctive display face like Instrument Serif, Vamos, or Distruction for headlines), never as the single default everywhere with no pairing.

### 4b. Color direction — the palette is decided: build around "Let's Be Thinkers" (HAUS)

**Chosen palette for this build — "Let's Be Thinkers" (HAUS).** This is not inspiration to synthesize from — it's the actual direction to implement. A dark, grainy, moody palette (dusty rose against muted teal and near-black slate) — it should read as considered and a little editorial, not default-AI-cheerful:

- `#2F4454` — slate blue-gray (elevated/secondary surface)
- `#2E151B` — deep maroon-black (darkest base surface)
- `#DA7B93` — dusty rose/pink (**primary accent** — CTAs, active states, key highlights; use deliberately, not everywhere)
- `#376E6F` — muted teal (secondary accent)
- `#1C3334` — deep teal-black (base surface)

**These 5 swatches are a mood board, not a complete UI token system yet — extend them before implementing:**
- Generate tints/shades of each for surface elevation levels, hover/pressed states, and disabled states.
- None of the 5 is a usable near-white or light neutral. Derive a light neutral (warmed slightly toward this palette, not pure white — see the anti-slop list) only if a light surface is genuinely needed; this palette leans dark-first by nature.
- Add semantic colors (success/error/warning/info) desaturated toward this palette's warmth/coolness balance rather than generic stock red/green/yellow.
- Verify contrast before locking anything in: check `#DA7B93` on `#1C3334`/`#2E151B` against WCAG AA at real text sizes. If it falls short for body text, produce a lightened variant for text use specifically, and keep the swatch value as-is for larger/decorative uses (buttons, icons, illustration, large headings).
- This palette leans dark-first. Confirm against Phase 0's findings whether meow is currently light-first — if so, flag that before flipping the app's default mode, don't just do it silently.

Feed these five hex values into `/ui-ux-pro-max`'s generator in Phase 2 as a **hard input/constraint**, not a suggestion — its job is to build the full token system and pair typography/spacing/components around this exact mood, not propose a different direction.

**Reference palettes — do not build from these for this pass. Record them in `MASTER.md`/`DESIGN.md` as documented alternates** (useful later for a seasonal theme, a future re-skin, or as a fallback if HAUS doesn't hold up once applied to real screens):

1. *Futuristic Minimalism* — sleek blues/dark tones, clean and modern: `#0691FF` (primary accent), `#2D425C` (primary base), `#E2E1E2` (complementary accent), `#F9FCFF` (background)
2. *Natural Calm* — earthy greens/blues/neutral grays, grounded and soothing: `#7AC789` (primary accent), `#2C425C` (primary base), `#A7ADB1` (complementary accent), `#FCFCFC` (background)
3. *Study Hard* — warm grounding neutrals: `#675547` and `#E3BD90` (primaries — logo/headlines/backgrounds), `#DED3B5` and `#C1BDBC` (neutrals/backgrounds), `#6D6E35` (accent, for buttons/sections that need to stand out), `#3B3B3B` (text)
4. *Minimal Colors (by Dumma Branding)* — bold saturated gradient: `#FF1D58`, `#F75990`, `#FFF685`, `#00DDFF`, `#0049B7`
5. *Niche Collection S&S* — dark editorial luxury: `#FFFFFF`, `#367D8A`, `#285F6B`, `#133336`, `#010001`
6. *The Extra O* — architectural dusty blue: `#FFFFFF`, `#242424`, `#5C7C89`, `#1F4959`, `#011425`

Also referenced, principle only, not hues: a "confident multi-hue branding can still read as trustworthy" example (a fintech wallet brand using green/blue/pink/yellow together, paired with visible trust signals — user counts, star ratings, support availability — placed near the CTA).

### 4c. Layout references

**Marketing/hero-section patterns** (from a "hero sections of the month" roundup — use as structural inspiration for meow's landing/home/onboarding hero, adapted to app UI rather than a marketing site). Open each image below — the written line is only a summary of what's in it:
- `hero-references/01-immersive-uiwiki.png` — bold single headline + one primary CTA + minimal nav, on a dark/gradient tech background (e.g. "Crafted for Engagement" / "Start your Free Trial").
- `hero-references/02-pixel-bloom-ai.png` — headline + two CTAs of different weight (primary + secondary), clean top nav with a dropdown.
- `hero-references/03-winzy-travel-booking.png` — inline functional widget overlaid directly on the hero image (a search/booking form sitting on top of a photo hero) — relevant if meow has any search/booking/matching flow.
- `hero-references/04-mansi-ux-saas.png` — small announcement pill above the headline ("New feature →"), single CTA, trust row (logos or stats) directly beneath the fold.
- `hero-references/05-flower-studio-editorial.png` — editorial hero: large headline, byline/date-style metadata line beneath it, minimal nav — good reference if meow has any content/feed/blog-like surface.

**In-app hero/card layout skeleton** — see `hero-layouts/01-hero-layout-a.png` through `04-hero-layout-d.png` (four frames of the same labeled wireframe, mobile 9:16 frame): a reusable pattern of `Navigation (top bar) → Title → Supporting text/caption → CTA → large Image → "save for later" affordance`. This is a good candidate structure for meow's primary content card or home hero unit if the app has a feed or discovery surface — treat it as a layout skeleton to adapt, not a literal template to trace.

### 4d. Hard constraints — do not produce any of these ("AI slop" checklist)

This is a checklist of the tells that make an app look generically AI-generated. Treat every item as a thing to actively avoid, not a neutral default:

harsh gradients · reflexively reaching for Lucide icons everywhere · pure white backgrounds · rainbow coloring · overused drop shadows · exactly-3-feature-cards-in-a-row layouts · emojis as UI decoration · liquid-glass/glassmorphism overuse · em dashes in UI copy · defaulting to Inter/Geist/Space Grotesk as the only "safe" font · colored left-stripe callout cards · fake testimonials · bento grids used reflexively · terminal-window graphics as decoration · "it's not X, it's Y" copywriting clichés · checkmark bullet lists as a default list style · exactly-3-pricing-tiers · no real product demos · the same soft corner-radius applied to everything by default · purple-and-black as the default "AI startup" palette · missing loading/skeleton states · decorative radial gradient orbs · dot-grid background patterns · sparkle (✨) icons as a recurring motif · animated arrows · missing Terms of Service · missing Privacy Policy · generic hover animations with no purpose · neon colors · lazy basic-pastel palettes used as a default.

Some of these are fine in the *right* specific context (a checkmark list can be correct if it's genuinely a checklist) — the point is intentionality: nothing here should appear because it's the path of least resistance.

## 5. Phase 2 — Generate the design system

Run something equivalent to:

```
python "$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py" "<meow's product type from section 0, e.g. 'cat social app playful trustworthy'>" --design-system -p "Meow" --stack <detected stack> --variance <see below> --motion <see below> --density <see below> --persist --output-dir .
```

If the script/skill accepts an explicit palette or seed-colors input, pass the five HAUS hex values from 4b directly rather than letting it propose its own palette. If it doesn't take a palette input, run it for the pattern/type/spacing system only, then manually override whatever palette it proposes with the HAUS one before persisting — the color decision in 4b is final for this pass, not a suggestion to weigh against alternatives.

Tuning dials (all 1–10): `--variance` (centered/minimal → bold/asymmetric), `--motion` (subtle → complex choreography), `--density` (spacious → dense). A consumer app home/feed screen typically wants something like `--variance 5-6 --density 4-5`; a settings/utility screen wants lower variance and higher density. Adjust based on what you found in the Phase 0 audit.

`--persist -p "Meow" --output-dir .` writes a `MASTER.md` design system file into the repo root — do this, so this design system stays the source of truth for future sessions, not just this one.

**Then**, write meow's own `DESIGN.md` following the structural pattern of one `awesome-claude-design` reference whose overall feel is closest to what you generated (e.g. Vercel for b/w precision, Linear or Raycast for clean SaaS minimalism, Superhuman for premium dark) — populated with meow's actual tokens, not the reference brand's.

**Checkpoint:** before touching more than one screen, show me the generated `MASTER.md`/`DESIGN.md` and the one representative screen you applied it to. Wait for my go-ahead before propagating the system app-wide.

## 6. Phase 3 — Apply the system across the app

Once approved:
- Centralize tokens (colors, type scale, spacing scale, radii, shadows, motion durations/easings) in whatever the stack's idiomatic location is (Tailwind config / theme file / design-tokens module).
- Update shared components first (buttons, inputs, cards, nav, modals, tab bars) so every screen inherits consistently, rather than hand-styling screen by screen.
- Then sweep individual screens, fixing layout/spacing/hierarchy issues surfaced in the Phase 0 audit as you go.
- Cover all interaction states: hover/press, focus-visible, disabled, loading (real skeleton states, not spinners-as-default and not "no loading state" — see the anti-slop list), error, and empty states.
- Confirm responsive behavior at the platform's real breakpoints/device sizes, not just desktop.

## 7. Phase 4 — Motion pass

Only after a screen's static design is settled, apply `/design-motion-principles` in create mode to that screen's key interactions. Respect the frequency gate (frequent micro-interactions stay short and subtle; rare, high-emotion moments — onboarding complete, a match, a purchase — can carry more choreography). Every animation must respect `prefers-reduced-motion`. Weight the motion personality toward restraint/production-polish given this is a consumer app with a playful but not gimmicky brand — pull less from the "playful/Jhey Tompkins" end unless a specific delight-moment calls for it.

## 8. Phase 5 — Final audit before calling it done

- Run `/design-taste-frontend` again, this time against the *redesigned* UI, and resolve anything it flags.
- Run `/design-motion-principles` in audit mode against the new interactive components.
- Verify the build/lint/tests still pass — this was a presentation-layer change; nothing functional should have broken.
- Spot-check color contrast on the final palette (text on background, button states) against WCAG AA.
- If you have browser/screenshot tooling available, capture before/after screenshots of the key screens for my review.

## 9. What I want back at the end

- The persisted `MASTER.md` (from `--persist`) and meow's own `DESIGN.md`.
- A short summary of what changed and why, organized by screen/component — not a line-by-line diff narration.
- An explicit list of anything you weren't confident about or intentionally deferred, so I can weigh in.

Do not start writing code until you've completed Phase 0 and shown me the Phase 2 checkpoint. Ask me anything from section 0 you need answered before that checkpoint — don't guess at meow's actual product identity.
