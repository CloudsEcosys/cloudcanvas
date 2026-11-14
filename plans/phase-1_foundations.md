<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 1 — Foundations

Master plan: `~/.claude/plans/deep-swinging-nova.md`. PDL: phase_1788294818016_0zq3zhy9m / sprint_1788294830746_tajja5l1p.

**T0 (first, blocks A–F):** split `src/pins/traits.js` → `src/pins/traits/{base,display,interaction,graph,registry}.js`; keep `traits.js` as a re-export barrel. No behavior change; all 34 tests stay green.

Parallel tracks after T0:
- **A — Test harness**: `happy-dom` devDependency; delete the in-source Node DOM stub (`pin.js:112-135`); headless = `element === null`; migrate suites.
- **B — Timing**: `_loop(ts)` real rAF dt (`min(ts-last, 50)`, `tick(dtMs/16.67)`, `viewport.update(dtMs)`); `PinParticle.update`: `friction ** dt`.
- **C — Native events**: `Pin extends EventTarget`; `PinEvent extends CustomEvent` (`payload`→`detail` alias, `cancelled`→`defaultPrevented`, origin in `detail.source`, never mutate foreign events); `transmit()` = normalize → per-node trait `onTransmit` hooks + native `dispatchEvent` → explicit parent-chain bubble; `TransmitterTrait` relay creates fresh `PinEvent` + relay-chain guard.
- **D — Manager**: `removePin` collects pin + all descendants (pins map, particle engine, indices); pre-mount queue flushed by `setContainer`/`mountAll`; `capabilityIndex`/`traitIndex` maps replacing O(N²) scans.
- **E — Trait factory**: registry stores `{name, ctor, defaults}`; `create()` throws on unknown; instance index for `pinsWithTrait`/`session.regraph`; `addTrait` throws on duplicate (+`replaceTrait`); `PinTrait(options, fixed)` with capability **union**; kill `typeRegistry`, `VectorPointerTrait` (rotate helper survives), `ScopeTrait.title`, `pin.session` click path (focusOnClick → `onPointerUp` + drag-travel guard); `session.focus` reads focussable `padding/maxZoom`; wire `DisplayTrait.validate` into `setContents`.
- **F — Breadcrumb access**: `ancestors()`, `breadcrumb()`, `scopeTrait(name)` (starts at parent), `deriveFromScope(name, key)`. Opt-in per call; no automatic inheritance.

**QA gate**: full suite green under happy-dom; new regression tests — trait-state isolation across pins, capability-union merge, addTrait unknown/duplicate throws, CustomEvent transmit non-mutation + bubbling, removePin descendant accounting, variable-dt determinism, breadcrumb APIs. Then git commit.
