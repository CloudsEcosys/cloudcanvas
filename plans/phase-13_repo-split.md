<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 13: Repository split (retire cc-main)

Status: **cutover** (2026-11-14). Approved by Richard the same day.

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
| S13.0 | Frozen contracts | Done: contract above; base `kernel` + exports at `3c73544` |
| S13.1 | Four repos build and test standalone | Base done (`5100599`): 92 unit + 2 browser pass; build/check:dist/size pass; fresh-clone `npm ci` green; core ESM 11.9 KiB gz. Deviations: grep gate matches dated history only (SECURITY 0.6 URLs, old plans); core-spec/style-gates/tokens tests went to lib by the rule (QA decides); happy-dom pinned 20.12.0 (20.14.6 breaks DOM-spy tests). Contract amendment `f0a116f`: `cloudcanvas/testing` (runFrame, loopStep, needsFrame, SPEC_KINDS) and `cloudcanvas/style-gates`, needed by 32 lib test files. Lib first pass (`c78f2b4`): 940 unit + 262 browser pass, build/size/boundary pass, one core copy; board bundle keeps the 0.6 name `cloudcanvas.board.iife.js` (sandbox loads it by name); `.npmrc allow-git=root` (npm 12 refuses git deps otherwise). Lib restore `9458ef2`: 1322 unit/integration + 263 browser pass, base pinned `f0a116f`; core-spec.test.js still held (QA: move to base, keep its one styles.js assertion in lib). mcp `5f2d900`: extern/cloudcanvas removed; packages served under `/vendor/<pkg>/` with a serve-time import map (CSP hash-pinned); 611/613 (only the pre-existing port-8770 WebSocket test); browser check clean. Site first pass (`260c0b2`): 264 unit/integration + 98 browser green only with names lib did not expose; lib amendment `b69cb7f` adds `cloudcanvas-lib/coerce`, `cloudcanvas-lib/sandbox/testing`, `SVG_STATE_CSS` from `svg-state`, `HTML_KEY` from `sandbox` (lib 1323/1323). Site finishing against it |
| S13.2 | All gates green, test count reconciled | In progress. Site done (`d4764a3`): 342 unit/integration + 98 browser, live :8090 and static export clean. Reconciliation by test name vs cc-main (1764 unit/integration, 403 browser titles): 40 names missing before QA; renames accounted; real gaps fixed: core-spec (10) to base, base packaging guards (exports list, blit/type only, in-package boundary, tree-shaking, core-only bundle, E1 no-GPU, 8 KB minimal) in `b4bfdcf`, engine-page 2D goldens split base 1 / lib 5 (`b4bfdcf`, `db4acda`), lib re-export test. Dropped by decision: test-ledger (0.4 port ledger spanning repos), public-api-ui.json (unread snapshot). Browser titles: none missing. Counts now: base 109, lib 1324, site 342 unit/integration; mcp 611/613 (pre-existing port-8770 test). SECURITY.md stays in base as the project record; lib and site READMEs link it. Independent review: no critical/high; 6 medium (site dev-server serves dotfiles through an in-root symlink; read-stream crash on unreadable file; no guard against a core copy in lib dist; lib `sideEffects` misses dist/esm/defaults; base boundary test accepts unshipped files; base has no top-level side-effect guard) + 14 low. Fixing all mediums and L1-L6, L8-L11, L13 (mcp private) in the four repos; L7 partly (Host allow-list; env names kept); L12 re-pin at cutover; L14 pre-existing oversized files left. npm names `cloudcanvas` and `cloudcanvas-lib` are unclaimed (Richard to decide: claim or scope) Fixes landed (each held by a test that failed first): base `aebbab4` (shipped-file boundary incl. import.meta.resolve/new URL/templates, load-effect check, harness pipeline, size no-baseline/orphan rows fail, build absWorkingDir + staged dist swap + full stale scan, exact pins) - 119 unit + 3 browser; lib `0ef7be0` (no core copy outside board IIFE, dist/esm/defaults sideEffects, boundary run-time paths, harness pipeline, served-path guard + tests, size, build, esbuild pin) - 1347 + 269; site `0042388` (symlink real-path rules, stream 500, Host 421 incl. arrival address) - 351 + 16 + 98; mcp `c7d371a` (testing.js denied at any depth, page served hashed under any spelling, web/ containment, roots via import.meta.resolve, private) - 655/657 (port 8770 only). SECURITY.md 0.7.0 section `6d6e032`. Known: mcp tests leave /tmp/cloudcanvas-keytest-* dirs (pre-existing) |
| S13.3 | Pushed, recloned, cc-main deleted | Pushed straight to main (base master matched): base `0.7.0` then `0.7.1` (`1f3df60`), lib `0.7.0` then `0.7.1` (`155271b`), site `08fe9b7`, mcp `c9ed18e`; site/mcp pin both over `git+https` at `#0.7.1`, lib pins base at `#0.7.1`. Deviation: 0.7.1 was needed because npm prepares a git dependency that has a `build` script (full dev install; lib's git devDependency then refused), so `build` is `build:dist`; and npm 12 `allow-git=root` refused package.json git deps on plain install, so lib/site/mcp use `allow-git=all`. `/home/persist/cloudcanvas` is now a plain folder of the four clones (+ `.pdl/`, `.claude/`); `arts/` moved into base (`logo.png` tracked, `.xcf` ignored). Fresh-clone gate: base 119 + 3 browser, dist, size; lib 1347 + 269 browser, dist, size; site 351 + 16 + 98; mcp 655/657 + 26 integration (port 8770 only). One intermittent browser failure each in lib and site on the first run, both clean on rerun (not identified). /tmp staging and 161 leftover mcp keytest dirs removed. Pending: push of the logo/plan commits; delete `CloudsEcosys/cc-main` |
