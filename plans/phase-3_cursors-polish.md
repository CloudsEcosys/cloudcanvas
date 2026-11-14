<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 3 — Cursors & Polish

Master plan: `~/.claude/plans/deep-swinging-nova.md`. PDL: phase_1788294825858_ztkksdlwr.

- **Null-pin cursors** (`src/pins/cursor.js`): global utility pin (`__cursor__`, `utility: true`, non-interactive) in overlay layer, filtered from `getAllPins`/queries. Traits `cursor-focus` (reuses focus reticle + frustum primitives), `cursor-selected`, `cursor-activated` — independent targets, registry definitions (reskinnable). Retained SVG nodes through the conjugate renderer. `FocussableTrait.onGlobalRender` + focussable branch of `_renderGlobalTraits` die. Session is single writer of cursor state.
- Example app: reload-strategy demo, `loadChildren` provider demo, custom cursor registration, markup moved to `html` key.
- Docs: ARCHITECTURE.md synced to reality (layers, registry factory, reload, events); breaking-change log (6 items per master plan).
- Full Playwright smoke suite committed under `tests/browser/`.

**QA gate**: cursor targeting (3 simultaneous targets), utility-pin query exclusion, docs accuracy pass. Then git commit.

## Status (docs / example / smoke track)

- [x] Header sweep: mandated copyright line across `src/`, `tests/`, `examples/` -
      complete, including the five files the cursor track owned (`session.js`,
      `viewport.js`, `index.js`, `manager.js`, `traits/interaction.js`). Zero files
      missing the line.
- [x] Example: lazy-toggle initial label fixed; reload-strategy demo
      (`pin_active_strategy` unmounts / `pin_persistent_strategy` hides) and
      `loadChildren` provider demo (`pin_provider_scope`, 300ms simulated server)
      added. No build step.
- [x] Example: dead `FocussableTrait` options (`cursorColor`, `showFrustum`, `label`)
      removed, and a `Cursor: Default/Custom` HUD button re-registers `cursor-focus`
      with overriding defaults + `session.remountCursors()`. Reskin verified in
      chromium (stroke, label, frustum off, one group, target preserved).
- [x] `ARCHITECTURE.md` synced: file tree, ConjugateRenderer frame contract, reload
      strategies + provider, native events + Pin signals, trait factory registry,
      breadcrumbs / root promotion, cursor system, PhysicsTrait damping correction.
- [x] `CHANGELOG.md` (new): 0.2.0 breaking-change log, 13 items + release notes.
- [x] `tests/browser/{harness,smoke}.test.js` + `npm run test:browser` (Playwright,
      chromium, skips cleanly when the dependency is absent).
- [x] `ARCHITECTURE.md` §2.9 de-caveated and synced to the shipped shape (CursorTrait
      subclasses, `registerDefaults` provider, `remountCursors`, PinSignalBus writer
      path); §2.2 / §2.6 / §2.3 drift about per-Pin cursor options corrected.
      `CHANGELOG.md` items 10 and the cursor bullet updated to match.
- Verified: `npm test` 169/169 green, `npm run test:browser` 12/12 green.
