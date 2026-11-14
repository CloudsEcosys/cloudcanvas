<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Plan: Blit Core Cleanup — code, docs, project, examples

## Context

CloudCanvas works, but it is sprawling:
- **Engine:** a 177-export Pin engine, where a minimal "one canvas + one pin" still pulls in 48 KB of the 60 KB bundle (gzipped).
- **Docs:** forked READMEs and ARCHITECTURE files, a MODULES.md that is about 10% accurate, a stale CHANGELOG, and a PLAN.md for work that already shipped.
- **Site:** 6 entry pages, 3 property editors, a 12k-line builder, and an unreviewed WIP batch that brought 69 `!important` and 31 phantom tokens.
- **Plans:** Phase 11 planned the cleanup and Phase 12 planned the Pin→Blit change separately. That means splitting and renaming code that is about to be deleted.

Richard's direction:
- The cleanup happens *through* the Blit refactor, reusing the existing scaffolding and tightening it.
- **The core exports exactly `blit` and `type`:**
  - **Blit:** a thin handle over any DOM element. State lives in a WeakMap, the DOM tree is the hierarchy, and events are native.
  - **Type:** a potential state backed by a `<template>`.
  - **Port:** the binding function that connects a blit to whatever draws it. The default is the browser; gpu, canvas or any anonymous function can be ports.
  - **Traits:** add-on functions, pay-for-use.
- **Site:** one 3D website sandbox. Anything with utility in line with the core and library gets folded in.
- **Editors:** the 3 editors are one primitive in different configurations.
- **Restructure:** happens early (src→`.plugin`, lib→`.addons`, examples→`.site`, parent→private `CloudsEcosys/cc-main`).

The outcome is a small core, pay-for-use add-ons, one consolidated site, docs derived from code, and no "pin" or "particle" vocabulary left.

## Program shape

- This plan **replaces** `plans/phase-11_core-cleanup-soc.md`:
  - its 13 KEEP tracks are absorbed;
  - its 18 MERGE tracks become refactor steps;
  - its 4 OBSOLETE tracks (T2.1–T2.4, alias migration/removal) are dropped.
- It is written into the repo as `plans/phase-11_blit-core-cleanup.md`, and the old file is marked superseded.
- The PDL gets updated:
  - Phase 11's name and objectives are rewritten.
  - Phase 12 is trimmed to GPU ports and the 3D camera (its S12.2–S12.4).
  - Phase 12 plan fixes: remove its S12.R rename-first track, and correct T1.5. Capture-phase hooks are wrong; the core listener must be installed first on each element.
- **The Phase 11 protocol is kept as-is:**
  - trees P/S/L/X;
  - single committer, bottom-up signed commits, no Co-authored-by trailer;
  - a same-named `sprint/*` branch in all 4 repos, never pushed;
  - fast-forward `main` and push S/L/X at each sprint close.
- **Every step is gated:** Dev (Developer) → QA (QA Engineer) → Fix (Developer, opus) → Verify (QA, fable) → commit.
- **Strangler approach:**
  - Blit is built alongside Pin, the internals move under it, and then Pin is deleted.
  - The old module paths stay as re-export stubs until the delete step, because tests deep-import 40 src modules.
  - lib and the site run on Pin/session compatibility facades until their own migration sprints.

## Sprints

### S0 Safety net and baseline (no behaviour change)
- **Fix the live CSS bug:** add the missing `}` after `@media (pointer: coarse)` at `src/graphics/styles-css.js:725`, plus a brace-balance test.
- **`scripts/size.js`** (esbuild in memory, min + gzip per entry) plus `size-baseline.json`. It must reproduce 59.6 KB (full), 48 KB (minimal entry) and 17 KB (pure-marked bare import).
- **`tests/fixtures/public-api.json`:** a snapshot of the 177 exports, which becomes gate G4.
- **Characterisation tests:**
  - transmit order across 3 levels (hooks, then listeners per node), cancel, `bubbles:false`, relay termination (`src/pins/pin-scope.js:74-97`, `traits/graph.js:81-88`);
  - a read/write frame spy (no layout read after the first style write);
  - an idle frame makes zero writes;
  - the builder's template, sidebar and studio golden tests (Phase 11 T0.4, asserted on the DOM and `data-sandbox`, not the Pin API).
- **Migrate the 37 deprecated-alias call sites:** 25 in lib, 12 in examples, 1 in `src/pins/reaction-actions.js:353`.
- **Phase 11 T0.6 items:**
  - remove the `navigator.webdriver` first-run bypass (`examples/website-sandbox.js:345`) so tests exercise first run;
  - `clearSession`;
  - the theme preset.
- **Retroactive QA** of the ungated XSS commits (T0.3) and the SVG batch.
- **Logger seam** (`src/log.js`; Phase 11 T1.1).
- **One `asText`/`toNumber`** (`lib/coerce.js`; T1.6).

### S1 Restructure (GPLAN.md, executed)
- Create the private `CloudsEcosys/cc-main` repo and add it as the parent's remote.
- `git mv` the submodules to `.plugin` / `.addons` / `.site`, renaming the submodule names too.
- Point `.gitmodules` at CloudsEcosys, then run `git submodule sync`.
- `scripts/dev-server.js:88` and the test harness static server:
  - allow exactly those 3 dot-roots as the first path segment;
  - keep rejecting every other dot segment (the SECURITY.md invariant).
- Update the path references:
  - `package.json` (main, exports, files);
  - `scripts/build.js:39`;
  - about 91 test files and fixtures;
  - `lib`'s `../src` imports;
  - the 29 examples files.
- Also absorbed from Phase 11: one package truth (T5.1: delete `src/{dist,scripts/build.js,package-lock.json}`), dist freshness `build --check` (T5.2), and dev-server hardening (T5.3).
- **Exit:** a fresh clone of cc-main with `git submodule update --init` passes `npm test` and `npm run test:browser`.

### S2 Core alongside Pin (steps 2–3)
- **`.plugin/core/`** (about 1,200 lines target, 1,500 ceiling, no file over 400), reached through a temporary `./next` export:
  - `state.js` + `blit.js`: WeakMap state; the handle is cached in the state, which gives stable identity.
  - `spec.js`: from `hydrate.readConfig`/`coerce`.
  - `frame.js`: from `frame.js` plus the renderer read phase (`renderer.js:277-354`) and `mounting.flushStructure`.
  - `port.js`: the default port is `_writeContents` (:468) plus the `_applyPosition` diff (:502) plus `formatTransform3D` (`styles.js:90`).
  - `root.js`: from `host.mountLayers`, `RenderRootScope` (`mounting.js:184`), `hydrate`, `framing.fitBounds`, `navigation.focusPin`.
  - `camera.js`: `Viewport` (`viewport.js:222`), trimmed, exposing its view as a matrix (ready for the Phase 12 perspective camera).
  - `type.js`: from `defineComponent` identity plus `mergeOptions` and the no-silent-replace rule of `TraitRegistry.register` (:95).
  - `css.js` + `index.js`.
- **Geometry moves into blit state:**
  - Every Pin gets an element; headless (no-document) mode is dropped, as a declared breaking change.
  - Pin gains public `size`/`bounds`.
  - `harness.js:203` `particleOf` becomes `boundsOf`.
  - The 12 Tier B test files move to rename-only.
  - `ParticleEngine` queries switch to global bounds (a declared fix for `engine.js:120`).

### S3 DOM hierarchy and native events (steps 4–5)
- **Hierarchy from the DOM:**
  - Detaching (unmount, offload, promotion) parks the element behind a Comment anchor, so its ancestry stays readable.
  - `pin.js:101-102` Sets are replaced by DOM queries, after one step of a shadow check that compares the two.
- **Events:**
  - `transmit` becomes `emit` (a native CustomEvent with `bubbles:true`).
  - The first-installed core listener on each element runs the trait hooks, and stops propagation when an earlier node cancelled.
  - The root stops propagation at the host.
  - The relay resolves targets by DOM id through the WeakMap instead of `context.pinMap`, and keeps `relayChain`.
- **Gate:** the S0 characterisation tests pass unmodified.

### S4 Frame, ports and function traits (steps 6–7)
- **Frame:** `ConjugateRenderer` is replaced by the core frame (structure → read → write).
  - Only dirty blits are processed, and an idle root stops requesting frames.
  - Passes are registered: `SvgGroupLayer` (`svg-groups.js:65-81`, :198-240, the pattern) and `ScopeWellPass` and cursors in the write phase; offload and physics in the read phase.
  - Fix `svg-state.js:330-338` (a style write every frame, now in the write phase).
- **Traits become functions:** `(b, opts, root) => cleanup`.
  - An `adaptTrait(Ctor)` bridge carries the class-based traits over first; then drag, select, resize, connect, focus, physics, svg-state and cursors are converted.
  - The extension contract becomes `trait` / `port (b, ctx)` / `tick(fn, 'read'|'write')` / `blit.use({name: fn})`, where the same name with a different function throws, and a late `use()` upgrades existing `[data-name]` elements.
- **No registration on import:** all eager registration (`registry.js:66-87,165`, `cursor.js:463`, `reaction-actions.js:409`, `context-menu.js:170,281`) moves to one opt-in module, `cloudcanvas/defaults`.

### S5 Types and root collection (steps 8–9)
- **Types:**
  - `type()` plus `<template data-type>` and `[data-slot]` fill; plain text by default.
  - HTML only in slots marked `data-slot-html`, which carries the XSS fix forward.
  - The card/media/raw display templates become types.
  - `defineComponent` / `definePrototype` / blueprint / custom and slotted types become shims over `type()`.
- **Root:**
  - `blit('#app')` provides the layers, camera, `view(b)`, a settable `root`, the frame loop, the `[data-blit]` scan (which replaces hydrate/adopt), and a MutationObserver that attaches and cleans up traits.
  - The session and `PinManager` shrink to compatibility facades.
  - The closed options whitelist (`session-options.js:32-41`) is deleted.
  - pan, keyboard (which takes `role=application` from `announcer.js:99`), menu and announce become root traits.

### S6 Packaging (step 10)
- Add-ons go to `.plugin/addons/*`, one subpath each:
  - drag, select, resize, physics, connect, focus, pan, keyboard, announce, menu, cursors, offload, layout, lazy, edit, style, reactions, place (grid spatial index), svg-state (with the vectorizer), graphics, css/*
- `"sideEffects": ["./defaults.js"]`, plus `/*@__PURE__*/` on the frozen token tables.
- A multi-entry build with per-add-on CSS chunks; `./core` exports only `blit`/`type`.
- The size ratchet starts here.

### S7 `.addons` consolidation (step 11)
- lib's 50 files become the forms, display, pinboard, serialize and export add-ons, each built as `type()` plus trait functions, and each importing only public subpaths. That removes the deep imports in `list.js:25-34` and `archetypes/*`.
- **Save format:** `SANDBOX_FORMAT_VERSION` goes from 1 to 2 (nested specs, `lib/sandbox/serialize.js:117`). `migrate-v1.js` is a one-time loader, protected by a v1→v2 golden test. serialize (544 lines) is split once, here.
- **Moved to `.site`** (builder product code): custom-types, slotted-type, pages.
- **Rebuilt as types:** archetypes, made useful and capable, or cut.
- **Deleted:** `createChatChannelPin` and `createCalendarBoardPin` (demo scaffolding with hardcoded ids), and the group re-export (`lib/sandbox/index.js`).
- **Phantom tokens:** all 31 are defined in the token catalogue (16 of them `--cc-sticky-*`), so every token can be themed.

### S8 `.site`: one 3D website sandbox (step 12)
- **Base:** the `website.html` shell plus the builder; this becomes the single app.
- **Folded in when aligned with the core and library, otherwise deleted:**
  - the Examples tab, `index.html` + `app.js` and `gallery.html` + `gallery.js` become sample layouts and types inside the sandbox;
  - `svg-3d-sculpt.html` contributes the vectorizer and 3D state as a sandbox tool (vectorized pencil strokes, 3D-transformed blits).
  - The browser tests move from `openPage` (`index.html`) to a `tests/browser/fixtures/` page.
- **One inspector primitive:** a single `inspector` type with 3 configurations (`dock`, `modal`, `quick`) over one field set.
  - It replaces sidebar-inspector (538 lines), the modal editor (707 plus its sections) and the dead `createInspector`.
  - Every field writes through the style API, which fixes the radius bug at `sidebar-inspector.js:424`.
- **One structure panel:** the drawer and Pages panel merge into one panel over `pagesFor`, with folders saved in the spec.
- **Layouts as data:** the 3 hardcoded builders (about 1,350 lines, `website-sandbox-templates.js`) become v2 JSON layouts loaded through deserialize.
- **CSS:** one stylesheet per panel, with 0 `!important` and no selectors on engine-private `.cloudcanvas-*` classes.
- **Codemod:** a script handles the mechanical calls (`createPin` → `root.blit`, `setContents` → `set({fill})`); the builder internals are converted by hand, file by file, gated by the browser suites.

### S9 Delete Pin, sweep vocabulary, docs (step 13)
- **Delete:** `.plugin/pins`, `particles`, session, manager, renderer, the re-export stubs and `./next`; `.` now points at the core. `cloudcanvas-pin*` and `data-pin-id` become `[data-blit]`.
- **Rename** the 43 unit and 23 browser test files that only need renaming (Tier C).
- **Docs** (re-derived from the code; one copy of each):
  - **README:** one README, one quick start that is executed in a test.
  - **ARCHITECTURE:** one ARCHITECTURE for blit/type/port/add-ons, with a file tree generated by a script.
  - **GUIDE:** rewritten for the new syntax.
  - **CHANGELOG:**
    - a 0.5.0 entry with a Pin→Blit migration table;
    - fix the inverted dates between 0.4.0 and 0.3.0;
    - add the missing XSS and SVG entries.
  - **SECURITY:** list every markup sink, including `setSlot` and `cursor.js:353` or their replacements.
  - `.plugin/README.md` + `.addons/README.md` become short pointers.
  - **Deleted:** MODULES.md, MODULES_PLAN.md, PLAN.md and GPLAN.md (executed in S1).
  - Every doc gets the exact header `Written by Richard Christopher, Copyright 2026 NeoTec, LLC`.

### S10 Exit
- Run every exit check; tighten the size baseline to its floor.
- Record the QA log and PDL retrospectives.
- Re-bundle the backups; tag `0.5.0` locally. Tags on the public repos and `npm publish` stay owner actions.

## Critical files
- `src/engine/renderer.js`, `mounting.js`, `frame.js`, `session.js`, `viewport.js`, `host.js`, `svg-groups.js`
- `src/pins/pin.js`, `pin-element.js`, `pin-scope.js`, `traits/registry.js`
- `src/graphics/styles-css.js`, `styles.js`
- `lib/sandbox/serialize.js`
- `examples/website-sandbox*.js`
- `tests/browser/harness.js`
- `scripts/{build,dev-server}.js`, `package.json`, `.gitmodules`

## Verification
- **Every step:**
  - `npm test` and `npm run test:browser` with 0 failures and 0 skips (floors: 897 / 156, adjusted only by named test replacements);
  - a size-report row;
  - the S0 characterisation tests unchanged through S8;
  - the QA agent's verdict, logged.
- **Exit checks:**
  - `Object.keys(await import('cloudcanvas'))` is exactly `['blit','type']`;
  - the minimal entry (a root plus one blit) is ≤ 8 KB gz;
  - an add-on imported but unused bundles to 0 bytes;
  - the `defaults` bundle is ≤ 59.6 KB gz;
  - the core totals ≤ 1,500 lines;
  - no file over 500 lines anywhere, and none over 400 in the core.
- **Vocabulary, zero hits:**
  - `rg -i '\bpins?\b|Pin[A-Z]\w*|particle|cloudcanvas-pin|data-pin-id'` across .plugin, .addons, .site, tests and scripts, excluding CHANGELOG and `migrate-v1.js`;
  - `rg -n '^(export )?const \w+ = (new \w+|register\w*)\('` finds only pure Map/WeakMap allocations.
- **Site:**
  - 0 `!important` and 0 phantom tokens in `.site`;
  - `npm start` serves the 3D sandbox; a Playwright smoke test builds, saves, reloads, exports, and loads a v1 save.
- **Fresh clone:** cloning cc-main gives green tests.
- **Review:** an adversarial review with zero confirmed critical or high findings.

## S9 track plan (measured 2026-09-27, after S8.D)

This plan was measured by a Plan agent. It totals about 330 files, about −27k/+12k lines. There is no Pin compatibility add-on: the only consumers, `.addons` and `.site`, are converted here, and external users get a CHANGELOG migration table plus `scripts/migrate-0.5.js`. If S9.D overruns, the phase stops there, with Pin still present and every suite green; S9.E–F then slide to the next phase.

| Track | Goal |
|---|---|
| S9.A Bridge | The session root becomes the host's core root (`data-blit-root`). Pin elements get `data-blit` and `id`, so Pins and blits share one canvas. `blit.use()` with no argument lists names (G0). Test selectors move off `data-pin-id`/`.cloudcanvas-pin`. |
| S9.B Gap add-ons | style, layout, edit, reactions, lazy, offload, place (free spot, move, hit), history and breadcrumb. New subpaths `./graphics`, `./theme`, `./log`, plus the export IIFE. Each ports its legacy suite; `tests/fixtures/test-ledger.json` records old → new test. |
| S9.C .addons | forms, text, divider and list move to `defineWidget`, alongside the 9 board components; editable goes onto `edit`, and snap-to-grid becomes a function trait. The sandbox write/restore/export become blit-native (still format v2; the goldens stay byte-identical). |
| S9.D .site | Read side, then write side, then creation, then boot, one commit per file. A codemod handles the mechanical calls. |
| S9.E Delete Pin | Delete `pins/`, `particles/`, the legacy engine and the bridges. `.` points at the core; `./next` goes. `public-api.json` becomes `["blit","type"]`. Test rewrites follow the ledger. Tag `pre-s9e` first. |
| S9.F Vocabulary | `.cloudcanvas-pin*` becomes `[data-blit]`/`[data-scope]`/`cloudcanvas-card-*`; "pinboard" becomes "board", and `pinned` becomes `anchored`. Tier C test renames. `scripts/vocab.js` joins `npm test`. |
| S9.G Docs | The S9 docs list. Can run alongside S9.E–F. |

**The exit vocabulary regex is corrected.** The earlier case-insensitive pattern matched spinner, mapping, typing and pinch. The new pattern is case-sensitive and whole-token:
`\b[pP]in(s|[A-Z]\w*)?\b|\bpin[A-Z]\w*|particle|cloudcanvas-pin|data-pin-id`
The exemptions are CHANGELOG, `migrate-v1.js` and the `migrate-0.5` rule table.

**Codemod:** `scripts/codemod/` uses acorn + acorn-walk (devDependencies) with source-range splicing. It shows a dry-run diff with a hit count per rule, gated to within ±5% of the inventory. It must be idempotent, and every rule has golden tests. It runs as one commit per rule.

## S9.C/D conversion map (2026-09-28)

Measured from a full inventory of `.site` + `.addons`. Every Pin concept the builder relies on, and its blit form:

| Pin concept | Blit form |
|---|---|
| `createCanvasSession` | `createBoard(host)` (`.addons/sandbox/board.js`): `blit(host)` plus the standard add-ons |
| `createPin({...})` | `parent.blit({id, type, x, y, z, w, h, <typeKey>: contents, chrome, bordered, drag, select, resize, layout, gap, style})` |
| `getPin` / `removePin` / roots / all | `app.find(id)` / `b.remove()` / `app.blits` / `allBlits(app)` |
| `parent` / `children` / `reparentPin` / `reorderChild` | `b.parent` / `b.blits` / `place.move` / `layout.reorder` |
| Utility Pins (cursor) | none: cursors draw in the overlay, never as blits |
| `contents` Map, `setContent(s)` | widget contents (`cloudcanvas/widget`): `contentOf`, `setContent(s)` |
| `displayTrait.name`, `setDisplayTrait`, `rebuildDisplay` | `data-type`; `retype(b, name)` rebuilds a blit in place; `bind` re-runs on every write |
| `defineComponent`, `makeRegistrar`, `build/update` | `widget({name, html, keys, bind, render})`; `onAttach`/`onTransmit` become `bind` listeners |
| Traits by name, `addTrait` / `replaceTrait` / `traits.get` | named traits as spec keys: `b.set({resize: opts})`, `b.spec.resize`; load aliases `draggable`→`drag`, `selectable`→`select`, `resizable`→`resize`, `focussable`→`focus`, `snap-to-grid`→`snapToGrid` |
| `ConnectableTrait` / `TransmitterTrait` | `connect: {connections}`; forwarding is the flow-node widget's own |
| `chrome` / `bordered` | plain data keys, styled by the card CSS chunk; chromeless drag via `drag: {handle: true}` |
| `reload` | dropped (no activation lifecycle); `offload` is the offload trait |
| Style / layout / edit lock / selection / focus stack | `style`, `layout`+`gap`, `edit`, `select`, `history` add-ons |
| `transmit(PinEvent)` / `onSignal` / `destroy` | `b.emit` (bubbling, cancelable) / host listeners / the core `remove` event |
| Particle vectors as data | contents keys (`tilt`, `progress`, `value`, `delta`) |
| Reactions (`sourcePinId`/`targetPinId`) | `cloudcanvas/reactions`, `{source, signal, action: {target}}` — the wire shape |
| Context menu `{pin}` | `menu(app, {registry})`, context `{target, x, y}` |
| Session-keyed stores | keyed by the root element |
