<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 4a — Design System & Visual Correctness

Master plan: `~/.claude/plans/deep-swinging-nova.md` §4a. PDL: phase_1788315865537_8lshj4gs6.

## Token sheet (dark = baked-in `var()` fallbacks; theme = property writes on `.cloudcanvas-host`)

Foundations: `--cc-font` (system stack) · `--cc-type-xs/sm/md/lg` 11/12/13/15px · `--cc-space-1..4` 4/8/12/16px · `--cc-radius-sm/md/pill` 6/10/9999px · `--cc-shadow-1` `0 4px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)` / light `0 2px 8px rgba(15,23,42,.10), 0 1px 2px rgba(15,23,42,.08)` · `--cc-shadow-2` `0 12px 32px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.09)` / light `0 12px 28px rgba(15,23,42,.18)` · `--cc-z-svg/plane/overlay/veil/elevated/drag` 10/20/30/900/1000/1100.

Parts (dark → light): `--cc-bg` #0f1117→#f4f5f7 · `--cc-grid-dot` rgba(255,255,255,.12)→rgba(15,23,42,.14) · `--cc-text` #e2e8f0→#1e293b · `--cc-text-muted` #94a3b8→#64748b · `--cc-accent` #38bdf8→#0284c7 · `--cc-focus` #833446→#9f3a52 · `--cc-focus-glow` rgba(131,52,70,.35)→rgba(159,58,82,.25) · `--cc-focus-veil` rgba(8,10,16,.45)→rgba(241,245,249,.55) · `--cc-card-bg` rgba(30,41,59,.85)→rgba(255,255,255,.92) · `--cc-card-border` rgba(255,255,255,.1)→rgba(15,23,42,.12) · `--cc-card-max-width` 340px · `--cc-scope-bg` rgba(0,0,0,.2)→rgba(15,23,42,.05) · `--cc-scope-border` rgba(255,255,255,.15)→rgba(15,23,42,.15) · `--cc-scope-overflow` hidden · badge tokens (light: rgba(2,132,199,.10)/#0369a1/rgba(2,132,199,.3)) · `--cc-btn-bg/border/text` rgba(56,189,248,.12)/rgba(56,189,248,.35)/#7dd3fc → light rgba(2,132,199,.08)/rgba(2,132,199,.35)/#0369a1 · `--cc-meter-track` rgba(255,255,255,.1)→rgba(15,23,42,.08) · `--cc-meter-end` #ec4899→#db2777 · `--cc-connector` rgba(56,189,248,.6)→rgba(2,132,199,.55) · `--cc-cursor-focus/selected/activated` var(--cc-focus)/#38bdf8/#34d399 → same/#0284c7/#059669 · `--cc-focus-ring` (2px outline + 2px offset, accent).

API: `applyTheme(host, vars)` (setProperty/removeProperty; null clears) + frozen `LIGHT_THEME`, exported from styles.js + index.js.

## Steps
1. **Foundation**: rename 13 template classes → `cloudcanvas-pin-*` via exported `CLS` table (display-templates.js); all inline styles → `CANVAS_DEFAULT_CSS`; full default ruleset for every template class; every hardcoded value → tokens; primitives read tokens (`safeColor` accepts `var()`); example strips redundant rules + gains theme toggle. Includes 4b hand-off CSS: `:focus-visible` ring, pin `:hover` lift, btn min-height 28px + 44px `@media (pointer: coarse)`, `@media (prefers-reduced-motion: reduce)`, `.is-selectable-text .cloudcanvas-pin-content { user-select: text }`, `.cloudcanvas-live-region` visually-hidden.
2. **Injection split**: `injectCanvasStyles()` write-once base; `injectSessionStyles(css)` → `<style data-cc-session>`; session wiring (customCSS option, destroy removes) lands with track B (session.js owner).
3. **Scope well**: default `display:none; min-height:0`; renderer toggles `cc-populated` + writes `minHeight` from live-child extent (WeakMap-cached, change-gated, px-quantized; write phase after positions; re-queue parent measure — converges one level/frame); `overflow: var(--cc-scope-overflow, hidden)`; mirror in `applyReloadMode` for renderer-less pins.
4. **Elevation**: drop blanket `will-change` → renderer-toggled `cc-moving` (sweep ~30 idle frames); `cc-elevated` ancestor-chain walk on focus/drag transitions (`setElevationChain` helper); focus veil div inside plane, `--cc-z-veil`, opacity transition, `transparent` disables; replace `!important` z-index literals.
5. **SVG layer**: camera transform on the layer (`transform-origin: 0 0`) + `vector-effect="non-scaling-stroke"`; connector stroke tokenized. Tradeoff: dash length scales with zoom (documented).
6. **Focus cursor**: frustum from ACTUAL parent scope (`screenBoundsOf(target.parent)`, none at root; guard unmeasured width>0); ~35%-lerp tapered corner segments; dashed rect removed; label defaults to pin title; colors tokenized.
7. **Camera**: log-space scale (`start*(target/start)**ease`); `EASINGS` table + fn support, `easing` honored; `prefersReducedMotion()` collapses durations (JS in 4b's viewport edit — coordinate).
8. **Sweep**: card max-width token (explicit width sets maxWidth:none); radii/spacing/type via tokens.

## Tests
Unit: token-discipline regex over CANVAS_DEFAULT_CSS (permanent invariant); class-prefix walk over built templates; no style attrs except sanctioned SVG slots; write-once injection; LIGHT_THEME keys ⊆ referenced tokens; scope minHeight math; elevation chain add/clear; log-zoom midpoint (1→4 at ease .5 = 2); frustum-args spy; connector markup has non-scaling-stroke.
Browser: bare fixture (`tests/browser/fixtures/bare.html`) "looks designed"; light theme flips computed styles; `elementsFromPoint` elevation truth; connector endpoint within 2px of pin center at 2× + pan; scope clips + parent grows.

## Deferred out of step 1/2 (all now landed)

- ~~**`--cc-card-max-width` ships with fallback `none`.**~~ **Landed with step 8.**
  Fallback is `340px`; `createDefaultElement` writes `maxWidth: none` inline whenever a
  Pin is given an explicit `width`, so no authored size is clamped.
- ~~**`--cc-scope-overflow` fallback `visible`.**~~ **Landed with step 3.** Fallback is
  `hidden`, on `.cloudcanvas-pin-scope.cc-populated` only.
- ~~**`--cc-cursor-focus/selected/activated` are not in `LIGHT_THEME` yet.**~~
  **Landed with step 6.** All three are in the table, `cursor.js` is in
  `TOKEN_READING_SOURCES`, and `styles.test.js` now *requires* the three keys.
- **Session wiring for `injectSessionStyles`** (the `customCSS` option and its removal on
  destroy) is track B's, per step 2. The exported signature is the whole contract:
  `injectSessionStyles(css) -> HTMLStyleElement | null`, marked `data-cc-session`.
- **Weight tokens added** beyond the sheet above: `--cc-weight-medium` (500) /
  `--cc-weight-semibold` (600), so the token-discipline test can cover every `font-*`
  declaration without an exception list. Also added: `--cc-grid-dot-size`, `--cc-card-blur`,
  `--cc-card-border-hover`, `--cc-btn-bg-hover`, `--cc-control-min` / `--cc-control-min-coarse`,
  `--cc-media-max-height`, `--cc-scope-min-height`, `--cc-badge-dot`, `--cc-focus-ring-width`
  / `--cc-focus-ring-offset`, `--cc-shadow-focus`.

## Carried out of steps 3-6/8

- **The scope well's ring is an `outline`, not a `border`.** The renderer's `min-height`
  is measured from child offsets, which are relative to the well's *content* box; a 1px
  border under `box-sizing: border-box` (which the example page declares globally with
  `* { box-sizing: border-box }`) eats two pixels out of that box and clips the last row
  of every well by exactly its own width. The well therefore states its own
  `box-sizing: border-box` and draws the dashed frame with `outline` + `outline-offset:
  -1px`, which occupies no layout at all.
- **The connector group still gates on `viewportVersion`.** Now that the SVG layer
  carries the camera transform, a connector's markup is camera-independent and a pan
  redraws it for nothing. The gate lives in `SvgGroupLayer._traitChanged`, which is
  generic across every global-render trait, so dropping the version there would silently
  change the contract for any trait that *does* draw in screen space. Left as-is; the
  fix is a per-trait opt-out (`trait.screenSpace === false`), not a change to the shared
  gate.
- **Example heights removed rather than bumped.** With clipping real, every authored
  `height` in `examples/app.js` that disagreed with its content became a visible cut:
  the focused child's "Focus Me" button, both strategy cards' bodies, and the two scope
  frames themselves. All were dropped so content sizes itself (the two scope frames keep
  their widths); the provider scope moved from `y: 520` to `y: 620` to clear the parent
  frame, which is now as tall as its well.

## Risks
Scope-size feedback loop (mitigated: change-gate + quantize); happy-dom layout (use helpers, browser carries truth); will-change removal jank (cc-moving restores during motion); veil bounds ±100000px; class-rename blast radius (export CLS constants, CHANGELOG).
