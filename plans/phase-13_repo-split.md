<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 13: Repository split (retire cc-main)

Status: **proposed** (2026-11-14). Nothing below is executed until approved.

## Decisions (Richard, 2026-11-14)

- cc-main is retired: each repo builds, tests and documents itself. GitHub repo **deleted** after verification.
- `cloudcanvas` (base) is the project: the core, importable in isolation.
- `cloudcanvas-lib` is the endpoint every plugin is pulled from, individually: **all engine add-ons and the widgets**.
- Repos depend on each other through **npm git dependencies** (`github:CloudsEcosys/<repo>#<tag>`); local dev uses `npm link`.
- `/home/persist/cloudcanvas` becomes a plain folder of four clones named after their repos.
- Moved files start **fresh** in their new repos (no history carried). cc-main's history is lost on delete.

## Dependency facts (verified 2026-11-14)

- `core/` imports only `log.js`. `graphics/` imports only `core/`. Nothing in core imports an add-on.
- `ui/` (103 files) imports add-ons (`trait`, `keyed-list`, `announce`, `motion`, `pan`); `defaults.js` imports
  `addons/actions.js`. Both must move with the add-ons or base would depend on lib.
- `graphics/css/*` are the add-ons' CSS chunks (board, pan, drag, menu, panel...).
- lib reaches the engine by ~90 relative `../../.plugin/...` imports; site by ~60 `../.plugin` / `../.addons` imports.
  All become package specifiers.

## Target layout

| Repo (folder) | Owns | Package / entries | Depends on |
|---|---|---|---|
| `cloudcanvas` | `core/`, `log.js`, `graphics/` minus `css/` (primitives, theme, tokens, styles helpers), `index.js`; engine tests; GUIDE, ARCHITECTURE, CHANGELOG, SECURITY, PLAN, `plans/`, `.pdl/` | `cloudcanvas`: `.`, `./core`, `./log`, `./theme`, `./primitives`, `./tokens`; own `build`, `dist/`, `size` | none |
| `cloudcanvas-lib` | `addons/` (58), `ui/`, `defaults.js`, `graphics/css/`, forms, display, components, archetypes, sandbox; their unit + browser tests | `cloudcanvas-lib`: one entry per plugin (`./drag`, `./pan`, `./panel`, ..., `./ui`, `./forms`, `./sandbox`, `./defaults`); own `build`, `dist/`, `size` | `cloudcanvas` (peer) |
| `cloudcanvas-site` | the site, `dev-server.js`, site browser tests, static export | private app | `cloudcanvas`, `cloudcanvas-lib` |
| `cloudcanvas-mcp` | MCP server, sync hub, web client | private app | `cloudcanvas`, `cloudcanvas-lib` (replaces `extern/cloudcanvas` submodule; served from `node_modules` with an import map) |

Import change for consumers: `cloudcanvas/drag` -> `cloudcanvas-lib/drag`, `cloudcanvas/forms` -> `cloudcanvas-lib/forms`,
`cloudcanvas/ui` -> `cloudcanvas-lib/ui`. `cloudcanvas` keeps `blit`, `type`. `scripts/migrate-*.js` gains the table.

## Sprints

Contracts frozen before S13.1: the table above, entry names, and the rule that lib/site/mcp import only package
specifiers (enforced by a boundary test in each repo).

- **S13.0 Contracts** (serial): entry list per package, `exports` maps, version (breaking -> 0.7.0 unless told
  otherwise), boundary-test rule. Output: frozen contract section appended here.
- **S13.1 Split** (parallel, disjoint repos):
  - A base: remove moved dirs, own package.json/build/size/tests, docs move in.
  - B lib: receive add-ons/ui/defaults/css, rewrite imports to `cloudcanvas`, own package/build/size/tests.
  - C site: rewrite imports to packages, own dev-server/tests.
  - D mcp: npm deps + import map, drop `extern/cloudcanvas`.
- **S13.2 QA** (consolidated): every repo `npm test` + browser tests + build + size green standalone from a fresh
  clone; boundary tests; security, efficiency, code-quality review; test count reconciled against cc-main's 1764
  unit/integration + browser suite (no test silently dropped).
- **S13.3 Cutover** (needs separate go-ahead): push all four repos; reclone into the new folder layout; then delete
  `CloudsEcosys/cc-main` on GitHub.

## S13.0 frozen contract (2026-11-14)

Staging: `/tmp/cloudcanvas/split-20261114/{cloudcanvas,cloudcanvas-lib,cloudcanvas-site,cloudcanvas-mcp}`, branch
`split/0.7` in each; `cc-main-ref/` is a read-only cc-main clone (no submodules). Moved source is read from
`/home/persist/cloudcanvas` (`.plugin` = base @93232b2, `.addons`, `.site`, `tests/`, `scripts/`), read-only.

**Graphics helpers (Richard: base).** Base keeps `graphics/{theme,tokens,style-gates,vectorizer}.js` and
`graphics/primitives/`. `graphics/css/`, `graphics/styles.js` and `graphics/styles-css.js` are add-on CSS and move to lib.

**Base `cloudcanvas` 0.7.0** (committed `3c73544`): entries `.` (blit, type), `./core`, `./kernel`, `./log`, `./theme`,
`./tokens`, `./primitives`, `./element`, `./vectorizer`. `kernel.js` exports the 37 core-internal names lib uses
(frame, state, root, port, spec, type, use, camera, css). Frozen in S13.1: `core/`, `kernel.js`, `index.js`, `log.js`,
the kept `graphics/` files. Base bundles: `cloudcanvas.{esm,esm.min,iife,iife.min}.js` (global `CloudCanvas`), core only.

**Lib `cloudcanvas-lib` 0.7.0** (peer `cloudcanvas` `>=0.7.0 <0.8.0`):
- Layout: add-ons -> `plugins/<name>.js`, their CSS -> `plugins/css/`, `graphics/styles.js` + `styles-css.js` ->
  `plugins/styles.js` + `plugins/styles-css.js`; `ui/` -> `ui/`; `defaults.js` -> `defaults.js`; widgets stay where they are.
- Entries: `.` (the kit, was `cloudcanvas/lib`), `./forms`, `./display`, `./components`, `./archetypes`, `./sandbox`,
  `./ui`, `./ui/testing`, `./defaults`, `./graphics` (all add-on CSS), and one per add-on, same names as 0.6:
  drag select resize focus physics connect svg-state cursors pan keyboard menu announce observe motion types widget
  keyed-list style layout edit place history reactions lazy offload gpu orbit mesh svg-path sprites text video
  own-canvas xml html-canvas panel.
- Imports into base use package specifiers only (`cloudcanvas`, `cloudcanvas/kernel`, `/log`, `/theme`, `/tokens`,
  `/primitives`, `/element`, `/vectorizer`); a boundary test enforces it.
- Bundles: `dist/esm/<entry>.js` with `cloudcanvas*` external; `cloudcanvas-lib.esm.js` (external core);
  `cloudcanvas-ui.esm.js` (external core); `cloudcanvas-board.iife.js` self-contained (static export runtime).

**Site / mcp**: import `cloudcanvas` and `cloudcanvas-lib/*` only. Browser pages resolve bare specifiers with an
import map onto `node_modules`.

**Dependency wiring during S13.1-S13.2**: `git+file:///tmp/cloudcanvas/split-20261114/<repo>#split/0.7` (npm copies,
so one core per install). Swapped to `github:CloudsEcosys/<repo>#0.7.0` at cutover.

**Tests**: a test lives in the lowest repo containing everything it exercises. Heuristic first cut (cc-main 358 files):
base 107, lib 187, site 64; the agents correct it. Total reconciled in QA.

**Order**: S13.1a base + lib (parallel) -> S13.1b site + mcp (parallel) -> S13.2 QA.

## Risks

- Momentum (Mindfull) vendors cc-main's `dist/` bundles; bundle names and import paths change. Prior ruling
  (2026-09-28): external consumers are not protected; they migrate.
- Test helpers, fixtures and the browser harness are shared today; lib and site each get a copy.
- PDL still shows Phase 10 active; roadmap drift is corrected when this phase is recorded.

## Expected versus actual

| Sprint | Expected | Actual |
|---|---|---|
| S13.0 | Frozen contracts | |
| S13.1 | Four repos build and test standalone | |
| S13.2 | All gates green, test count reconciled | |
| S13.3 | Pushed, recloned, cc-main deleted | |
