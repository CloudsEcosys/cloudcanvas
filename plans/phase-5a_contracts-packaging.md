<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 5a — Framework Contracts + Packaging

Master: `~/.claude/plans/deep-swinging-nova.md` §5a. PDL: phase_1788396792954_4g0yz6h0w. Baseline: 134f370.

## Contracts
1. **Deferred pointer capture**: capture at drag-threshold crossing, not press (`_pendingCapture` on session; declined = controls/text-regions, forever); pinch captures both pointers at beginPinch; import `DRAG_THRESHOLD_PX` (never duplicate); window listeners deliver sub-threshold moves; `touch-action:none` keeps it touch-safe. Real click/dblclick reach pins. Browser probes gate the merge.
2. **Public invalidation**: `pin.invalidate(kind)`; `setVectors/setVector(i,v)/addVector/removeVector/clearVectors` invalidate 'content'; `rotatePin` drops sync render; `PinParticle.setVector` added.
3. **Drag signals**: `drag:start` (threshold), `drag:end` (final coords; `onPointerUp(pin, undefined)` = cancelled) in PIN_SIGNAL_TYPES; post-setPosition ordering guaranteed.
4. **Template kit**: `src/pins/traits/template-kit.js` — moved setText/setAttr/setSlot/setVisible/makeElement/makeTextNode + CLS re-export + `reconcileKeyedList(container, items, {key, create, update})` (~40 lines, DOM-as-state, accepts frozen items); `src/pins/traits/define-component.js` — `defineComponent({name, build, update, defaults, allowedKeys, chrome})` → DisplayTrait definition via registry, returns `{name, createTrait}`.
5. **Content defense**: re-assert CONTENT_CLASS at top of renderContent (self-healing).
6. **Chrome-less**: `chrome:false` option + honor `className:''` in createDefaultElement.
7. **Edit lock**: `pin.beginEdit(node)/endEdit()`; single gate in renderContent defers + `_editDirty` replays once; `setType` ends edit first; `'edit'` signal → session announces.
8. **place({within})**: occupancy-fn refactor; parent-local ring over child bounds; anchor > near-child > children-centroid > top-left default.
9. **Affordances**: `[data-cc-control]` appended to CONTROL_SELECTOR; keyboard Space → `onAction(pin, event, session)` trait hook ("Enter enters, Space acts").
10. **Style gates**: `src/graphics/style-gates.js` `checkStyleDiscipline(css, {prefix, extraTokenReaders})`; both sheets pass in tests; component injection → session-lifecycle removable.
11. **Scope scroll arbitration**: scope well opt-in (`--cc-scope-overflow:auto` / `[data-cc-scroll]`): wheel over a scrolling well scrolls the well (native), canvas zoom there requires ctrl/meta; routing lives in pointer/wheel layer.
12. **focus:changed**: session-level emitter (`session.events` EventTarget or equivalent minimal) firing on every focus/promotion/pop/unfocus transition with `{focusedPin, renderRoot, breadcrumb}`.
F-additions: `viewport.zoomToFit(bounds|pins, opts)` + `session.zoomToFit()`; session throws on unknown options (F2 — fixes silent `hostElement`); public `pin.session` getter.

## Packaging
- De-contaminate: delete top-level `registerDefaults` (components/index.js:117) + component re-exports in src/index.js; regression test: core import → exactly 11 traits.
- package.json: exports `.` `./components` `./styles` (`./styles.css` deprecated alias 1 release) `./package.json`; repository/bugs/homepage/engines/types; `--test-concurrency=1`; `sideEffects:false` ONLY after side effect dies (audit cursor registerDefaults timing).
- server.js → `scripts/dev-server.js`: bind 127.0.0.1 (HOST env override), `path.relative` containment + dot-segment denial + roots examples/+src/; same guard in tests/browser/harness.js.
- ConnectableTrait: drop `targets`/`connectTo` option aliases (keep `connections`).

## Professionalization (Sprint 5.4)
JSDoc→`.d.ts` via typescript devDep (`allowJs+declaration+emitDeclarationOnly`), types checked in + drift-gated; docs/VERSIONING.md (semver, warn-once-deprecate-next-remove, public-API definition), SECURITY.md, CONTRIBUTING.md; browser matrix (evergreen + Safari ≥16.4, native ESM); README corrections. Version 0.3.0; tag 1.0.0-rc.1 after final QA PASS.

## Breaking (0.3.0)
No auto-registration; components via `cloudcanvas/components` only; `targets`/`connectTo` removed; `injectComponentStyles` removable; `./styles.css` deprecated; sub-threshold presses don't capture (pins receive real clicks).
