<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 5b — Component Remediation + Four Demos

Master: `~/.claude/plans/deep-swinging-nova.md` §5b. PDL: phase_1788396792954_4g0yz6h0w. Baseline: 134f370. Builds on 5a contracts.

## Shared remediation (9 components + 2 traits)
Public-API imports only (no deep imports); `defineComponent`/registry everywhere (defaults live; factories stop `new`-ing); canonical fixed names; `allowedKeys` on all; `{build, update}` templates (no-op setContent = 0 mutations, gated); `chrome:false` + sanctioned className (double chrome + content clobber die); `'display'`→`'renderable'`; controls = `<button data-cc-control>` ≥ `--cc-control-min`; injection with teardown via registration.

## Per-component
- **sticky-note**: duplicate editor dies (Escape-commits bug); delegates to EditableTrait `{targetKey:'body', multiline}`; 24px token swatch buttons; tilt via vector-diff.
- **task-card**: keyed reconciler checklist (`role=checkbox` buttons, aria-checked); immutable items; `setVectors` not particle pokes.
- **telemetry**: `setVectors` dirty-marking + frame-aligned ticker util (component-side, built on invalidate); `data-status` + `--cc-status-*` tokens; setText diffing kills churn; session-destroy stops timers.
- **flow-node**: class-based pulse animation; binding refs not querySelector; transmit = control button.
- **workspace-group**: child-count invalidation via scope signals; contrast-fixed focus button; `pin.session` getter.
- **media-card**: setAttr src-diff; "Inspect" control implements the zoom claim (pushFocus + maxZoom).
- **chat-message/input**: reaction pills = reconciled text-node toggle buttons `aria-pressed` (XSS closed); composer transmits `chat:send` up; channel owns creation via `place({within})`.
- **calendar-event**: `data-severity` tokens; ack/resolve announced.
- **breadcrumb-bar**: REWRITE — trail from `session.breadcrumb()`, crumb per ancestor (keyed reconciler), click pops to that scope, hidden at true root; one session-level `chrome:false` pin repositioned per promotion (focus:changed signal).
- **EditableTrait**: beginEdit/endEdit lock; Escape removes blur listener before restore (race dead); replaceChildren; classes not inline styles; announces; multiline.
- **snap-to-grid**: rides `drag:end` signal; real-drag tested.

## Design system
styles.js → `styles/{base,cards,comms}.css.js` (<500 each) + `COMPONENT_CLS`; 103 raw colors → 0 via core-registered tokens (`--cc-sticky-*`, `--cc-status-*`, `--cc-severity-*`, `--cc-priority-*`, `--cc-radius-lg`) in LIGHT_THEME, contrast-computed ≥4.5 both themes, gate-asserted; hit targets; removable injection.

## Demos
- **Preview dashboard**: windows = `reload:'lazy'` scopes + loadChildren providers; hybrid preview (skeleton face pre-provision → `.is-preview` scaled live scope after; depth>1 deactivates to summary); `PromotableTrait` (real dblclick / Enter → pushFocus promote; guards controls); breadcrumb-back pin; overview ~8 elements.
- **Messenger** (`examples/messenger.*`): channel rail (promotable pins, unread badges) + active channel scope (lazy provider messages, content-driven layout); composer→`chat:send`→channel creates via place({within}); scope-scroll opt-in (contract 11); threads via connectors.
- **Calendar** (`examples/calendar.*`): day-column scopes (`drop-target` capability, promotable) + event pins; drag-between-columns: `drag:end` + queryBox + deepest drop-target + `addChild` reparent + coord conversion + relayout + announce; alerts rail (bubbled events, announcer, activated-cursor focus); resolve → collapsed column.
- **Gallery fixes**: resetView throw; zoomToFit button; breadcrumb/Back; theme label state; honest snap + grid hint; logEvent textContent; keyboard reachability.

## Tests
Per-component unit file (mounted sessions): factory/allowedKeys/registry/chrome, no-op-setContent=0, idle=0, single-change minimal, behavior + XSS payload inert, edit-lock survival, escape-cancel. `component-styles.test.js`: generalized gates + LIGHT_THEME completeness + contrast + size. `components-registry.test.js`: no import side effects, defaults reach factories. Browser: real dblclick promotion + breadcrumb return + lazy overview count; gesture suite (real snap drag, cross-column drag, edit-escape); messenger + calendar suites; light-theme contrast smoke.
