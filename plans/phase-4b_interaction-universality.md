<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 4b — Interaction Correctness & Universality

Master plan: `~/.claude/plans/deep-swinging-nova.md` §4b. PDL: phase_1788315865537_8lshj4gs6.

## Wheel/pinch spec (pointer.js)
- Normalize: deltaMode 0 ×1 / 1 ×16 (`LINE_HEIGHT_PX`) / 2 ×hostH||800; clamp ±160px/event (`MAX_WHEEL_DELTA_PX`).
- Zoom: `Math.exp(-k·d)` — `k=0.01` ctrl/meta (pinch), `k=0.0015` discrete wheel (~1.2×/notch, exact inverses). `deltaY===0` never zooms.
- Routing: ctrl/meta → zoom at pointer; `isDiscreteWheel` (`deltaMode≠0 || (deltaX===0 && |deltaY|≥40 && integer deltaY)`) → zoom; else → pan `panBy(-dx,-dy)`. Limits documented at module top; stateless; constants tunable.
- `preventDefault()` unconditional (host listener already passive:false).

## Pointer hygiene + touch
- Gestures require `isPrimary && button===0`. `activePointers: Map<pointerId,{x,y}>`; 2 pointers → cancel drag/pan, pinch state `{dist,midX,midY}`; move → `zoomAt(ratio, mid)` + midpoint pan; lift to 1 → re-seed lastPointer, continue pan. Pinch math in pure functions for unit tests.
- Guarded `setPointerCapture` (try/catch); window listeners remain delivery path.
- `contextmenu`: preventDefault + cancel gesture only when mid-gesture; else native menu allowed.
- Remove dead session fields: `activePointer`, `touchPinchDist`, `dragOffset`. Session wiring for 4a's `injectSessionStyles` (customCSS option + destroy removal) lands here (session.js owner).

## Keyboard (src/engine/keyboard.js, new)
Host single tab stop (`tabindex=0`, set only if absent); pins `tabindex=-1` roving. Host-focused: arrows pan ±40px (Shift ×4; content follows arrow intent), `+/=` `-/_` zoom 1.2× at center, `0` reset, `Enter` enter pin-nav (focusedPin's element or first in reading order), `Escape` popFocus/unfocus, `Home` unfocus. Pin-focused: arrows cycle READING ORDER (y-then-x over participating+active pins; spatial 2D nav rejected), `Enter` → `session.focus(pin)`, `Escape` → host (two-stage). Handled keys preventDefault; skip editable targets. `ensureVisible(pin)`: minimal scale-preserving pan (24px margin, 200ms, reduced-motion aware). Export `KEY_BINDINGS`.

## ARIA
Host: `role="application"` + `aria-roledescription="canvas"` + `aria-label` (default "Interactive canvas"; never clobber author values; never ship role without keys). Pins: `role="group"` + `aria-roledescription="pin"` (setupElement) + `aria-label` from title in the pin-render funnel, cached/change-gated (idle-zero-write invariant is load-bearing). Live region: `announcer.js` — one polite `role="status"` div, visually hidden inline, `announce()` with nbsp-toggle for repeats; announcements from session focus/popFocus/unfocus wrappers ("Focused {title}"/"Focus cleared"), provider load ("{n} items loaded"), `CHILDREN_ERROR_EVENT` ("Failed to load items"). SVG + cursor layers `aria-hidden="true"`. Example HUD `role="status" aria-live="off"` + label. No aria-owns/activedescendant.

## Reduced motion
`prefersReducedMotion()` in viewport.js — lazy cached matchMedia + change listener; `animateTo` jumps + fires onComplete synchronously when matched. CSS side in 4a.

## Contrast
`relativeLuminance(hex)` + `contrastTextFor(color, light, dark)` beside safeColor (both exported). `createBadgeSVG` (6-digit-hex tints only): text = contrastTextFor(tint composited over #1e293b); alpha floors bg .15→.25, border .30→.40; dot keeps raw tint. Unit sweep asserts ≥4.5.

## Placement (src/engine/placement.js)
`place(session, {width=200, height=120, near?, anchor?, margin=24})` → canvas top-left. Anchor: explicit > near-pin center > viewport screen-center (box-centered). Ring search k=1..12, radius k·step (step = max(w,h)·0.75+margin), 8+4k samples, deterministic; candidate free when padded `queryBox` (utility-filtered) empty; exhausted → last candidate. `session.place()` + index.js export; example spawns use it.

## Selectable text
Pin option `selectableText: true` → `is-selectable-text` class; pointerdown inside `.cloudcanvas-pin-content` of such a pin sets `event._ccTextRegion` → DraggableTrait.onPointerDown early-returns; drag from chrome still works; CSS in 4a.

## Order
1 pointer.js (first) → 2-6 parallel (keyboard / ARIA+announcer / reduced-motion / contrast / placement) → 7 selectableText → 8 example → 9 smoke.

## Tests
Unit: wheel matrix (burst ≥0.97, horizontal no-zoom+pan, line/page modes, clamp, round-trip exact 1.0), pinch pure-fn math, button filtering, contextmenu cancel, keyboard nav (viewport deltas, roving activeElement, Enter/Escape), announcer textContent, placement determinism + collision avoidance, contrast sweep. happy-dom gaps honest: no layout (inject hostRect), no capture semantics, matchMedia stubbed, live-region behavior asserted as textContent only.
Browser smoke: trackpad burst bounded [0.9,1.0]; horizontal swipe pans; CDP `Input.synthesizePinchGesture` pinch; keyboard walkthrough; targeted ARIA checks (no axe-core dep); right-click no-pan; badge contrast ≥4.5 in-page.

## Risks
Wheel heuristic misclassification (bounded by clamp; constants tunable) · `role=application` must ship with keys · pinch fidelity lives in smoke · aria-label funnel must stay change-gated.
