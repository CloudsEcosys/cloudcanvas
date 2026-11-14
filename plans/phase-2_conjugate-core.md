<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 2 — Conjugate Core

Master plan: `~/.claude/plans/deep-swinging-nova.md`. PDL: phase_1788294823455_1a8zw1zrf.

Critical path (sequential; SVG groups ∥ reload):
1. **Element split**: `.cloudcanvas-pin` → `.cloudcanvas-pin-content` (display-only) + `.cloudcanvas-pin-scope` (children; never rewritten). `getGlobalBounds` += cached `_scopeOffset`. Read-phase measurement via `offsetWidth/Height` (layout-space → fixes zoom corruption).
2. **ConjugateRenderer** (`src/engine/renderer.js`): activeSet/dirtyContent/dirtyStructure/measureQueue/viewportVersion/svgGroups. Frame: structure flush → batched reads → writes (content updates for dirty only; position pass via `_appliedPos` 3-float diff over all mounted pins; plane transform + SVG groups gated on viewportVersion). Session.tick rewired; renderAll path deleted. `pin._invalidate(kind)` contract; pre-registration replay.
3. **DisplayTrait templates**: `build(pin, contentEl) → bindings` on `pin._display`; `update()` mutates text/attrs only; SVG slots update on input change; `html` key = only innerHTML opt-in (escaping otherwise automatic via textContent); custom `render` runs content-dirty only, gets content element.
4. **Reload strategies**: `reload: active|persistent|lazy`, `defaultReload` on session; `lazy:true` compat mapping; `.is-dormant` display:none for persistent (skip measure, cache size); `loadChildren(pin)→Promise<PinSpec[]>` provider (pin → session → default), single-flight, `childrenerror`, removal-race guard, retained-on-deactivate + `unload()`.
5. **SVG groups**: persistent `<g data-trait>` per global trait fed by trait index; rebuilt only when viewport/relevant pins change.
6. **Root promotion**: focusStack entries gain `renderRoot`; `renderer.setRenderRoot()` reconciliation = promoted subtree + full ancestor chain mounted (breadcrumb navigable); off-chain siblings demote per strategy; cancel activeDragPin on unmount.

**QA gate**: reload matrix (mounted/hidden/absent × active/dormant), zoom-size invariance, scope-element identity across 100 renders, lazy provider tests, promotion-keeps-ancestors; Playwright: children persist 100+ frames, drag/pan/zoom, idle content-node identity stable. Then git commit.
