<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

> **Superseded 2026-09-26** by `plans/phase-11_blit-core-cleanup.md`. KEEP tracks absorbed there; kept for history.
# Phase 11 - Core Cleanup and Separation of Concerns

## Context

The 2026-09-17 deep analysis found the engine and lib cores green (874 unit, 154 browser) but carrying
about 5.9k LOC of never-QA'd work, a stored XSS in committed code, two competing packaging truths, 18
files over the 500-line bar, and documentation that names APIs which do not exist. Phase 11 makes the
base (`src/`) and the kit (`lib/`) correct, one-directional and truthful, and it ships the mechanical
gate that keeps them that way. It runs on today's repository layout: three submodules inside one parent
working tree, with all tests in the parent. Making each repo self-contained (own `package.json`, own
tests, own dist) is Phase 12 work and is explicitly out of scope here. Everything uncommitted is kept
and remediated in place; nothing is parked. Phase 11 ends at version 0.5.0, which is breaking because
the deprecated aliases are deleted.

## Operating protocol

### Working trees

| Tag | Path | Remote | Contents |
|---|---|---|---|
| P | `/home/persist/cloudcanvas` | none, local dev workspace | tests, scripts, dist, docs, `package.json`, submodule pointers |
| S | `/home/persist/cloudcanvas/src` | `CloudsEcosys/cloudcanvas` (PUBLIC) | the include system |
| L | `/home/persist/cloudcanvas/lib` | `CloudsEcosys/cloudcanvas-lib` (PUBLIC) | types, components, modules |
| X | `/home/persist/cloudcanvas/examples` | `CloudsEcosys/cloudcanvas-site` (private) | homepage and editor |

Target architecture is three self-contained repos. The parent is a local dev workspace and never gets a
remote. Its only backup is the bundle set at `/home/persist/cc-backups-<date>/{parent,src,lib,examples}.bundle`,
so re-bundling all four repos is a mandatory step at every sprint close.

The `.gitmodules` URLs currently point at `NeoTecDigital`, which are transfer redirects; the canonical
org is `CloudsEcosys` (process plan correction 1). Both those URLs and the `NeoTecLLC` URLs in root
`package.json` are corrected in T5.1.

### Single committer

Only the orchestrator runs git writes: `add`, `commit`, `switch`, `merge`, `tag`, `push`. Build and QA
agents may run only `git status`, `git diff`, `git log`, `git show`.

Banned for everyone: `git stash`, `git clean`, `git reset --hard`, `git checkout -- .`, bulk `git add -A`
or `git add .` (the S11.0 snapshot was the one sanctioned exception and it is already done),
`--no-gpg-sign`, force-push, squash, rebase or amend of any pushed commit, and `git submodule update`
inside the working checkout because it detaches HEAD.

Sprint branches are never pushed to the public `src` and `lib` origins. Pushing them would publish
unreviewed work, which the owner has not authorised; QA-passed ff-merges to `main` are pre-authorised,
and that is the only thing that reaches an origin. Tags on public repos, releases and `npm publish`
remain explicit owner actions at the time. This is the one deviation from process plan section 4, which
assumed a private parent remote to push to.

### Rule of one

One code track holds the build lock at a time. The lock covers any write to `src/`, `lib/`, `examples/`,
`tests/`, `dist/`, `scripts/` or `package.json`, and it is held through that track's QA. One paper track
(`*.md`, `plans/`, PDL, next-sprint Discovery and Design) may run beside it. Read-only agents are
unlimited. The lock board is one notepad note, `cloudcanvas-locks`, written only by the orchestrator.

Separate working trees are not separate for test attribution: tests import `../src` and `../lib` at
working-tree state along the chain src to lib to examples to tests, so a half-finished upstream edit
makes a downstream failure impossible to attribute. Git worktrees are rejected; git's own documentation
advises against multiple checkouts of a superproject.

Shared parent files force the full browser suite when edited: `tests/helpers/*`,
`tests/browser/harness.js`, `tests/browser/website-sandbox-helpers.js`, `dist/`, `package.json`.

### Per-track git sequence

The dev agent runs `npm run build` whenever S changed. QA passes before any commit. Then the
orchestrator commits bottom-up, submodules first so the parent never records a gitlink that does not
exist:

```bash
cd /home/persist/cloudcanvas
git -C src add -- <declared files>
git -C src diff --cached --stat                 # must equal the write-set, nothing else
git -C src commit -m "<short message>"
git -C src log -1 --format='%G? %ae%n%B'        # expect: G alephpt1@gmail.com, no trailer
# repeat verbatim for lib, then examples
git add -- src lib examples <declared tests> dist scripts/quality-baseline.json <docs>
git diff --cached --submodule=log --stat
git commit -m "<short message>"
git log -1 --format='%G? %ae%n%B'
git submodule status                            # no +, -, or U prefix
```

The parent gets exactly one commit per track: tests, rebuilt dist, submodule pointers, the baseline file
and the CHANGELOG line together. No push at track level.

### Commit verification

`commit.gpgsign=true` with key `59C6B42A731314B0`, author `alephpt1@gmail.com`. Every commit must verify
as `G` and must carry no `Co-authored-by` trailer. If the commit is not yet merged to `main`, amend it;
if signing fails or hangs on pinentry, stop and ask the owner to unlock the key. 27 of 38 parent commits
and 22 of 25 submodule commits already carry a Sonnet co-author trailer (process plan correction 2);
history is signed and already public, so it is left alone and the rule is enforced from Phase 11 onward.

### Sprint open and close

Open, after the previous sprint's ff-merge has landed:

```bash
for r in src lib examples; do git -C $r switch -c sprint/<id> main; done
git switch -c sprint/<id> main
```

The branch name is identical in all four repos. Ids in use: `sprint/11.0-safeguard` (live),
then `sprint/11.1-boundaries`, `sprint/11.2-api-removal`, `sprint/11.3-size`,
`sprint/11.4-registries`, `sprint/11.5-packaging`.

Close, after sprint Testing is green:

```bash
for r in src lib examples; do
  git -C $r switch main && git -C $r merge --ff-only sprint/<id> && git -C $r push origin main
done
git switch main && git merge --ff-only sprint/<id>
git submodule status                             # clean
git tag -a checkpoint/11.N -m "Sprint 11.N complete"   # parent only, local, no remote
B=/home/persist/cc-backups-$(date +%F); mkdir -p $B
git bundle create $B/parent.bundle --all
for r in src lib examples; do git -C $r bundle create $B/$r.bundle --all; done
for f in $B/*.bundle; do git bundle verify $f; done
for r in src lib examples; do git -C $r branch -d sprint/<id>; done
git branch -d sprint/<id>
```

Fast-forward only, because a squash or rebase would orphan the parent's recorded gitlink SHAs. Never
amend a submodule commit once the parent has recorded it. The re-bundle is not optional: the parent has
no remote, so skipping it leaves the sprint with no off-disk copy.

## Quality gates G1 to G8

QA reports every gate with numbers. Gate ids follow the approved programme plan. The core plan's own
numbering maps as: core G1 to G1, core G2 to G2, core G3 and G4 to G3, core G6 to G4, core G5 to G5.

| Gate | Command | Expected |
|---|---|---|
| G1 unit | `npm test` | `# fail 0`, `# skipped 0`, `# todo 0`, pass count at or above the last recorded number. Baseline 874 at parent 85f58a6 / src 10aaf0f / lib 0fb6a75 / examples 93b2853. Runs in about 4.5 s and leaves the tree untouched |
| G2 dist and browser | `npm run build && npm run check -- --check dist-fresh && npm run test:browser` | dist byte-identical to an in-memory rebuild; `# fail 0`, `# skipped 0`, count at or above baseline. Core plan quotes a browser baseline of 154; the ungated batch added browser files, so T0.2 records the real number first and that becomes the floor. Required for every S track, every shared-file edit, fix round 2 or later, sprint Testing and phase exit. `skipped 0` matters because the harness skips silently when Playwright is missing |
| G3 mechanical | `npm run check` | exit 0. Runs `scripts/check-quality.js` (all ratcheted checks) then `scripts/check-boundaries.js` (the hard layering assertions). Exit 2 means an entry improved and the baseline was not tightened: run `npm run check:update` and commit the shrunk baseline |
| G4 public API | `node --test --import ./tests/helpers/setup.js tests/unit/public-api.test.js` | passes. Any export-surface change must be an explicit, declared diff to `tests/fixtures/public-api.json` |
| G5 diff scope | `npm run check -- --check scope --allow "<write-set>"`, plus `git status --short` in P, S, L and X | only the track's declared files. `dist/` changes if and only if S changed |
| G6 goldens | the golden suites in `tests/unit/` | serialization round-trip, static-export and `CANVAS_DEFAULT_CSS` digest goldens unchanged, unless the track declared the change in its Design step. A `SANDBOX_FORMAT_VERSION` change is an escalation |
| G7 security | `npm run check -- --check sinks`, the hostile-payload unit test, one browser no-execution test, `/security-review` on the sprint diff | the sinks allow-list is unchanged or smaller. Required for any track touching sinks, import or fetch paths, type validation, `export-static`, or the dev server |
| G8 mutation probe | break the fix, watch the test fail, restore, prove with `git -C <repo> diff \| sha256sum` before and after | required on bug-fix and characterization tracks, at most 3 probes. One QA evidence row per pass in this file's QA log and one line in PDL |

Fix loop: at most 2 fix rounds, every re-QA reruns the full checklist, round 3 uses a fresh QA agent,
and a round 3 failure escalates.

Escalate to the owner on: an undeclared API fixture diff, a golden or format-version change, ratchet
growth, a new sinks allow-list entry, an edited or deleted test, a write-set that crosses layers, a new
dependency, a change to `exports` or `files`, remote or tag or force-push actions, a signing failure, a
reproducible flake, any `MODULES.md` item entering scope, any design fork, or a security finding of high
severity or above (stop the line).

## The gate script

### Files and scripts

- `scripts/check-quality.js` is the CLI entry. Its modules live under `scripts/quality/` and each stays
  under 500 lines: `scanner.js`, `imports.js`, `css.js`, `docs.js`, `repo.js`, `baseline.js`.
- Inputs: `scripts/quality.config.json` and `scripts/quality-baseline.json`.
- `scripts/check-boundaries.js` holds the four hard layering assertions, which are not ratcheted and are
  switched on as tracks land (see T0.2). The core plan specifies a separate boundaries script; the
  process plan folds layering into `check-quality` as the `layer-imports` check. Both exist: the
  ratcheted `layer-imports` check burns the existing violations down, the hard script fails outright on
  a rule that has already been switched on.
- `scripts/build.js` must export its targets and shared options and guard `main()` so importing it does
  not run a build.
- Dependency-free. No `acorn`, no new devDependency (programme plan G3).
- npm scripts to add: `check`, `check:quality`, `check:boundaries`, `check:update` (passes
  `--update-baseline`), `check:dist`, `verify` (check then test), `verify:full` (check, test,
  test:browser), and the browser subsets `test:browser:engine`, `test:browser:studio`,
  `test:browser:site`.

### Command line and exit codes

```
node scripts/check-quality.js [--check id,...] [--json] [--update-baseline]
                              [--phase-exit cleanup|pre-figma] [--since <ref>] [--allow "<paths>"]
```

| Code | Meaning |
|---|---|
| 0 | clean |
| 1 | a new violation or a regression |
| 2 | an entry improved but the baseline was not tightened. `--update-baseline` rewrites downward only |
| 3 | scanner or tool error. Never a verdict |

Output is one line per finding, `FAIL <check> <file>#<key> measured= baseline= limit=`, then
`RATCHET total=N (cleanup=a, pre-figma=b)`. That total is the burn-down number in every status update.

### Scanner

One character pass with a stack handles line and block comments, strings, template literals with `${}`
nesting, and regex literals. A `/` counts as a regex when the previous significant token is an operator,
an opening bracket, or a keyword such as `return` or `typeof`; character classes are respected. It emits
a comment mask and a structural mask. Self-check: at end of file the stack must be empty, otherwise
`SCAN-ERROR` and exit 3. The prototype ran 160 files and 1942 functions with 0 scan errors and
reproduced the audit's named offenders exactly. Invisible to it: arrow functions with an expression
body. Not counted: class bodies and object literals, which `file-length` catches. There is no inline
suppression syntax. `tests/unit/quality-scanner.test.js` covers the tricky tokenisation cases, and
`stats` assertions make sure a matcher that finds nothing cannot pass.

### Checks

Measured numbers are from the process plan's prototype run over the tree that is now committed at the
sprint head.

| id | Algorithm | At sprint head |
|---|---|---|
| `file-length` | Physical lines over 500 in `src`, `lib`, `examples`, `scripts` (`.js`, `.mjs`, `.html`, `.css`), excluding `dist` and `node_modules`. CSS-in-JS modules get the same limit | 18 (17 JS plus `examples/website.html` at 684) |
| `file-length:tests` | Freeze existing sizes, no growth, no new file over 500 | 18 test files over 500 |
| `function-length` | A `{` preceded by `=>`, or by `)` whose matching `(` follows a word outside {if, for, while, switch, catch, with, await}. Counts non-blank non-comment lines head to closing brace, limit 50. Key `file#name`, ordinal for duplicates | 31 code-line offenders (41 physical) |
| `nesting` | Enclosing control blocks plus nested function bodies, per outermost function, limit 3 | 12 |
| `layer-imports` | On masked source: `import ... from`, bare `import '...'`, `export ... from`, literal `import()`, plus inline `<script type=module>`. src imports only src; lib imports lib or a src barrel; examples import examples or a barrel; no bare specifiers; nothing imports `tests/` or `scripts/`. JSDoc `import()` lives in comments and is exempt | lib to src deep imports 12; examples to lib deep imports 1 |
| `deprecated-alias` | Names from `@deprecated` JSDoc in src plus `config.removedApis`, matched as `\.name\(` on masked source, with `(?<!particle)` for `getVectors`, `getVector`, `getPrimaryVector`. Test call sites counted separately | 22 names |
| `headers` | First 5 lines match `/Written by Richard Christopher.{0,40}Copyright.{0,12}2026 NeoTec, LLC/`. Forbidden-header regex `/Antigravity\|Co-authored/i`. JSON and LICENSE exempt | 3 missing |
| `forbidden-src` | On masked source: `console.*` and `debugger` in src and lib; `prompt`, `alert`, `confirm` in examples. On raw source: `TODO`, `FIXME`, `XXX`, `HACK`. Stub wording is report-only | 1 console |
| `sinks` | Allow-list plus per-file counts for `innerHTML=`, `insertAdjacentHTML`, `outerHTML=`, `eval`, `new Function`, `document.write`, `srcdoc`, `fetch(`, storage, non-literal `import()`. Not ratchetable: a new entry needs owner approval. After S11.1, src storage and network must be empty | 5 HTML-sink files; `src/pins/group.js` storage |
| `phantom-tokens` | Import the CSS modules so `${}` resolves, extract `<style>` blocks. Every `var(--x` read must be in `TOKEN_NAMES`, the product token module, an in-sheet declaration, or a `setProperty('--x'` call. Fallbacks ignored. src and lib may not read `--ccs-*` | 10 plus `--cc-font-mono` |
| `css-discipline` | `checkStyleDiscipline(css, {prefix:'ccs-'})` violation counts per sheet, plus `z-index:\d` literals, `.cloudcanvas-` selectors, inline `<style>` blocks | token 200 plus 3, important 39 (53 raw), prefix 1, z-index 7 |
| `dist-fresh` | Build in memory with `write:false` and `absWorkingDir=ROOT`, sha256 against `dist/*`. On failure print the esbuild version | root dist fresh; `src/dist` stale |
| `exports-resolve` | Every `exports`, `main` and `files` target in both `package.json` files must exist and be tracked (`git -C <owning repo> ls-files --error-unmatch`), and its static-import closure must be fully tracked | measured as failing for `lib/archetypes`, `group.js` and `prototype.js` while they were untracked; the WIP snapshot tracked them, so T0.2 re-measures and this should now pass |
| `docs-api` | In inline backtick spans (skipping spans containing `://`), match `name(`. Resolve receiver-aware through `config.receiverMap` (pin, session, viewport, pinManager), then barrel exports, then declared src and lib functions, then a builtin list. In fenced code, `import {...} from 'cloudcanvas...'` is checked against the exports map | ARCHITECTURE 19 (includes `selectPin`, `Webpage`), README 1 |
| `ratchet-monotonic` | Against `git show <merge-base>:scripts/quality-baseline.json`: no new keys, no larger numbers, no supersets. Exceptions only through `config.ratchetExceptions[{key, approvedBy, date, reason}]` | n/a |
| `commits` (`--since`), `pointers`, `scope` (`--allow`) | `commits`: author, `%G?`, no trailer, across all four repos. `pointers`: gitlink equals submodule HEAD, on a branch. `scope`: changed and untracked files are a subset of the write-set | n/a |

The `pointers` check drops the process plan's "present on the remote" clause: sprint branches are never
pushed, so that clause cannot hold under the current remote policy.

### Baseline format and ratchet semantics

```json
{ "schema": 1, "checks": {
  "file-length": { "src/engine/context-menu.js": { "value": 933, "zeroBy": "cleanup" } },
  "function-length": { "lib/sandbox/serialize.js#restoreTree": { "value": 55, "zeroBy": "never",
                        "reason": "embedded via toString by lib/sandbox/export-static.js:139" } },
  "layer-imports": { "lib/list.js": { "set": ["src/pins/traits/template-kit.js"], "zeroBy": "cleanup" } },
  "phantom-tokens": { "examples/website-sandbox.css.js": { "set": ["--cc-border"], "zeroBy": "pre-figma",
                        "ungated": true } } } }
```

- Measured above baseline is a failure (exit 1). Measured below baseline must be tightened (exit 2).
  Within the limit, the entry is deleted. A violation with no baseline key is a failure.
- A function moved to a new file therefore arrives with no key and under the limit, which is what
  enforces "no new fragments".
- `--phase-exit X` fails if any entry with `zeroBy = X` remains. `cleanup` falls due at the Phase 11
  exit; `pre-figma` falls due at the Phase 15 exit (the process plan wrote that as Phase 12, before the
  programme renumbering). `zeroBy: "never"` is the sanctioned allow-list and needs a `reason`.
- Generation, which resolves process plan D5: generate the baseline twice, once at `main` in each repo
  (the last QA'd state, parent `ad7ba4f`, src `ac4e50c`, lib `737ed31`, examples `f85f85f`) and once at
  the sprint head. The committed baseline is the sprint-head one, so the gate runs green, and every key
  present only at the sprint head is marked `"ungated": true` with a `zeroBy` due phase. Nothing from
  the ungated batch is silently grandfathered, and nothing is blocked before it can be fixed.

## Safety net and characterization tests

These land in S11.0 before any refactor.

- **Public API snapshot.** `tests/unit/public-api.test.js` over `tests/fixtures/public-api.json`. It
  records the sorted export names and the `typeof` of each barrel: `src/index.js` (168),
  `lib/index.js` (37), `lib/sandbox/index.js` (47), `lib/components/index.js` (77) and
  `lib/archetypes/index.js`, which already exists in the snapshot and so is in scope from the start.
  It also records the keys of the `styles` and `primitives` namespaces and the public prototype method
  names of `Pin`, the session and `Viewport`. Updating the fixture needs `UPDATE_FIXTURES=1` plus a
  matching declaration in the track's Design step.
- **Serialization goldens.** `tests/fixtures/sandbox/*.json`, captured at the sprint head. Coverage:
  nesting, every widget, per-pin style, reactions, pages, flat and slotted custom types, layouts,
  z-order, and the chrome and bordered flags. Two assertions per golden: load then serialize then
  `deepEqual`, and API-built scene then serialize then `deepEqual`. Goldens are never edited; a new
  golden needs a version bump and owner sign-off.
- **Static-export golden.** `renderStaticHtml(golden)` compared byte for byte, plus the ZIP member list.
- **Characterization per untested module**, written before the module is touched: templates (golden
  serialized tree per layout), sidebar-inspector (field inventory and mutation paths), drawer (extend
  the existing 16 untracked tests with the `renderTree` output shape), blueprint compiler (one DOM
  golden per node kind, plus `type="button"` and the attribute allow-list).
- **Known bugs are never enshrined.** The duplicate-pin content loss, the XSS and the `attrs` binding
  get a test for the correct behaviour and are fixed first.
- **Browser budget.** 300 s cap, serial. Subsets: engine (10 files), studio (the 11 `website-sandbox-*`
  files), site (1 file). Rerun a flake once in isolation; a second flake in the same sprint becomes its
  own track. Never skip a test.
- Computed-style goldens are Phase 15 work and are named here only so nobody builds them twice.

---

## S11.0 Safeguard and P0

### T0.1 Baseline, snapshot and safety net (COMPLETE)

Recorded as done, not to be re-planned:

- Preflight tarball `/home/persist/cloudcanvas-preflight-2026-09-17.tgz`.
- Per-repo bundles in `/home/persist/cc-backups-2026-09-17/{parent,src,lib,examples}.bundle`.
- Trunk unified: `main` is trunk in all four repos, fast-forwarded from `main-graphiti`.
- The ungated batch is committed on `sprint/11.0-safeguard` in all four repos and tagged
  `pre-cleanup-wip`. Heads: parent `85f58a6`, src `10aaf0f`, lib `0fb6a75`, examples `93b2853`.
  Each sprint branch is exactly 1 commit ahead of its `main`.
- `.gitignore` extended with `test-results/`, `scanner_cache/`, `artifacts/`, `arts/*.xcf`.
- Baseline `npm test`: 874 pass, 0 fail, 0 skipped.
- The snapshot commit verifies as `G alephpt1@gmail.com` with no trailer.

Superseded by the owner's decisions: the process plan's private parent remote
(`CloudsEcosys/cloudcanvas-workspace`) is not created, the `quarantine/<repo>-<date>` push is not done,
and the process plan's step 5 triage by `git restore --source=wip/...` does not apply because the batch
is already on the sprint branch. Remediation happens in place, on the sprint branch.

### T0.2 Gate tooling and safety-net tests (tree P)

- **Goal:** `npm run check` exists, is dependency-free, exits 0 on the sprint head, and every subsequent
  track has mechanically checkable acceptance.
- **Write-set:**
  - new `scripts/check-quality.js`, `scripts/quality/{scanner,imports,css,docs,repo,baseline}.js`
  - new `scripts/check-boundaries.js`, `scripts/quality.config.json`, `scripts/quality-baseline.json`
  - new `tests/unit/quality-scanner.test.js`, `tests/unit/public-api.test.js`,
    `tests/unit/package-exports.test.js`, `tests/fixtures/public-api.json`,
    `tests/fixtures/sandbox/*.json`
  - edit `package.json` scripts block only
  - edit `scripts/build.js`: export targets and shared options, guard `main()` against import
- **Reuse:** `checkStyleDiscipline` from `src/graphics/style-gates.js` and `isToken` from
  `src/graphics/tokens.js`, both reachable as public exports (`src/index.js:190`). Both, all five
  barrels and all three example CSS modules import in plain Node with no DOM, so the gate must call them
  rather than reimplement CSS parsing. The stripping approach from the audit's scratchpad `quality.mjs`
  seeds `scanner.js`; blanking template literals removes its CSS-string false positives. The frontend
  plan proposes promoting that file as `scripts/quality-gate.mjs`; the core and process plans both name
  `scripts/check-quality.js` with the npm script set above, so that is the name.
- **Steps:**
  1. Record Discovery numbers first: `npm test` count, `npm run test:browser` count and duration, the
     four HEAD SHAs. The browser number becomes the G2 floor.
  2. Build `scanner.js` and its unit test before any check that depends on it.
  3. Implement the checks table above, in that order, `--json` from the start.
  4. Generate the baseline twice (at `main`, at the sprint head), diff them, write the sprint-head one
     with `"ungated": true` on every key the `main` run does not have, and a `zeroBy` on every key.
  5. `check-boundaries.js` carries four rules, each behind a config flag, all off at first:
     src must not import lib or examples (on now); lib must not import examples (on now); lib imports
     from src only through `index.js` (switched on by T1.2); `src/pins` must not import `src/engine`
     (switched on by T1.5).
  6. `public-api.test.js` snapshots the five barrels per the safety-net section.
  7. `package-exports.test.js` asserts every `exports`, `main` and `files` target exists and is tracked
     in its owning repo. That closes SRC-01 and DOC-12 permanently and guards the `./archetypes` entry
     that already sits in root `package.json`.
  8. Capture the serialization and static-export goldens.
- **Behaviour preservation:** no source file outside `scripts/` and `tests/` is touched. `scripts/build.js`
  keeps byte-identical output; confirm with `--check dist-fresh` before and after.
- **Accept:**
  - `npm run check` exits 0 and prints a `RATCHET total=` line.
  - `node scripts/check-quality.js --check nesting --json` reproduces the audit's named offenders.
  - `npm test` rises by the new tests, still 0 fail, 0 skipped, 0 todo.
  - `node scripts/check-quality.js --phase-exit cleanup` exits 1 today, listing the due entries.
  - Every baseline key has a `zeroBy`; every key absent at `main` has `"ungated": true`.
- **Deps:** none. Blocks every gated track.

### T0.2b PDL reconcile (paper track, may run beside T0.2)

- **Goal:** PDL reflects reality before Phase 11 execution is tracked in it.
- **Write-set:** PDL records only. No repository file.
- **Steps:** close the 8 sprint records sitting in `planning`, `stuck` or `active` under completed
  phases; create the missing Phase 10 sprint record and close it, routing Track C into S11.0 T0.6 and
  Track D into Phase 13; create Phases 11 to 15 and the S11.0 sprint; note that `docs/VERSIONING.md`,
  `SECURITY.md` and `CONTRIBUTING.md`, planned in Phase 5a, never shipped.
- **Accept:** `sprint_list` shows no finished sprint in `planning` or `stuck`; phase percentage equals
  completed sprints over total sprints.
- **Deps:** none.

### T0.3 Stored-XSS fix, three layers (trees S, L, X, P)

- **Goal:** a custom type carrying an `html` field can never reach an HTML sink, on creation, on
  community import, on reload of an already-poisoned `localStorage`, or inside an exported site.
- **Layering:** the engine sink stays as it is. `card` plus `html` is documented, tested engine API
  (`tests/unit/display.test.js:300-345`) and the pencil tool legitimately uses `raw` plus `html`
  (`examples/website-sandbox.js:687-697`). Narrowing `HTML_OVERRIDABLE` to `raw` would be a breaking
  engine change and is not done.
- **Write-set:**
  - `src/index.js:147` add the `HTML_KEY` export
  - `lib/sandbox/custom-types.js:99-106` (`normalizeField`): drop reserved keys; add
    `RESERVED_KEY_PREFIX`, `RESERVED_FIELD_KEYS`, `isReservedFieldKey`
  - `lib/sandbox/index.js`: re-export the three new names
  - `lib/sandbox/serialize.js`: `optionsFor` inside `restoreTree` drops `html` from any node carrying
    `cc:typeName` and pushes a warning
  - `examples/website-sandbox-type-validation.js:61` (`fieldsProblem`): reject reserved keys with a
    user-facing message; fix the deep import at L24 to `../lib/sandbox/index.js`
  - tests: `tests/unit/lib-sandbox-custom-types.test.js`,
    `tests/unit/website-sandbox-type-validation.test.js`, `tests/unit/lib-sandbox.test.js`,
    `tests/browser/website-sandbox-community.test.js`
- **Reuse:** `normalizeField` is the one chokepoint every load path shares. The `page.route` mock at
  `tests/browser/website-sandbox-community.test.js:40-67`. The inline-literal precedent at
  `lib/sandbox/serialize.js:395` (`flowModes`).
- **Steps:**
  1. Add the constants and predicate in lib, export them through the barrel.
  2. Make `normalizeField` drop reserved keys, warning once per field.
  3. Make the examples gate reject them with a message, importing the lib predicate through the barrel.
  4. In `restoreTree`, strip `html` only where `cc:typeName` is present, and push a warning. The literals
     are inlined to keep `restoreTree` self-contained, because `lib/sandbox/export-static.js:139`
     embeds `restoreTree.toString()`; a unit test asserts the inlined literals equal the exported
     constants.
  5. Browser test: add an `evil.json` whose field `html` holds
     `<img src=x onerror="window.__ccXss=1">`, assert the row reports an error; then seed `localStorage`
     with the poisoned type directly, place it, and assert `window.__ccXss === undefined` and no
     `img[onerror]` in the DOM.
- **Behaviour preservation:** the pencil `raw` plus `html` Pin must still round-trip; assert it
  explicitly. The restore strip applies only to `cc:typeName` nodes, so engine-level `card` plus `html`
  is untouched.
- **Naming conflict:** the core plan names the lib exports `RESERVED_FIELD_KEYS` / `isReservedFieldKey`;
  the frontend plan calls it `RESERVED_CONTENT_KEYS`. Follow the core plan, which cites the chokepoint
  line range.
- **Accept:** G1, G2, G4 showing exactly plus `HTML_KEY` in src and plus three names in lib sandbox, G7
  including `/security-review` on the diff, and G8 mutation probe on the loader strip.
- **Deps:** T0.2 for the gate and the API snapshot.

### T0.4 Characterization tests before any refactor (tree P)

- **Goal:** pin current behaviour of the three surfaces with no meaningful tests, so T0.5 and Phase 13
  are provably behaviour-preserving.
- **Write-set (all new):**
  - `tests/unit/website-sandbox-templates-golden.test.js` plus
    `tests/unit/fixtures/templates/{webpage,landing,dashboard,blank}.golden.json`
  - `tests/unit/website-sandbox-sidebar-inspector.test.js`
  - `tests/browser/website-sandbox-studio.test.js`
- **Reuse:** `serializeSession` from `lib/sandbox/serialize.js`; `serializePin` at
  `lib/sandbox/serialize.js:263`; `openSandbox` at `tests/browser/website-sandbox-helpers.js:131`;
  `readGeometry` at `tests/browser/website-sandbox-helpers.js:192`.
- **Steps:**
  1. Goldens: for each `apply*Layout`, take `serializeSession(session)`, replace Pin ids with positional
     paths (`"0.2.1"`), rewrite binding `sourcePinId` and `targetPinId` to paths, and add a per-path
     `classList` map because classes are not in the snapshot (defect N5). Generate once from the
     imperative builders.
  2. Sidebar tests, group 2, green today: `[data-sandbox="inspector"]` starts hidden; `show(pin)` fills
     the four `[data-geometry]` inputs; a geometry input calls `applyGeometry`; X and Y are disabled
     under a flow parent; `toggleCollapse` works.
  3. Sidebar tests, group 3, red until T0.5 and marked as such in a comment naming T0.5: duplicate
     preserves contents, children, style overrides and parent; the content field writes
     `pin.contents.get('text')`; radius round-trips through `serializePin(pin).style['border-radius']`;
     the layout section is hidden for a non-container; the Free button is active on a free container.
  4. Browser test: drawer toggle; select then sidebar appears then edit X then the Pin moves; duplicate
     keeps its text; radius survives a reload. Plus two expected-fail characterizations, each commented
     with the track that flips them: the N5 undo/redo font-size check (flips in Phase 13 S13.3) and the
     N15 new-profile theme check (flips in T0.6).
- **Behaviour preservation:** no production file is touched in this track.
- **Accept:**
  - `node --test --import ./tests/helpers/setup.js tests/unit/website-sandbox-templates-golden.test.js`
    is green against unmodified templates.
  - The sidebar suite is green for group 2 and red only for group 3.
  - The 874 existing tests are untouched: `git diff --stat -- tests/` shows only new files.
- **Deps:** T0.2 (the goldens land in the same fixtures tree).

### T0.5 Sidebar-inspector bug batch, in place (trees X, L, P)

- **Goal:** fix defects N1, N2 and N3 without moving any file, routing every write through a sanctioned
  writer.
- **Write-set:**
  - `examples/website-sandbox-sidebar-inspector.js` (L38 option constants, L50/61/77 the dead
    `onDuplicate` option, L277, L283, L306, L331-334, L353, L373, L390, L460-468, L473, L492-514,
    L533, L537)
  - `examples/website-sandbox.js:358-372` (the wiring)
  - `examples/website-sandbox-editor-content.js:226` (`createContentEditor` gains an `only` filter, a
    5-line addition)
  - new `lib/sandbox/pin-ops.js` (first slice: `clonePin`), `lib/sandbox/index.js`
  - tests: the T0.4 sidebar suite plus `tests/unit/lib-sandbox-pin-ops.test.js`
- **Reuse:** `serializePin` (`lib/sandbox/serialize.js:263`) and `restoreTree`
  (`lib/sandbox/serialize.js:387`); `reparentPin`; `applyLayout`, `layoutOf`, `canHostLayout`
  (`examples/website-sandbox-layout.js:49-75`); `createContentEditor`
  (`examples/website-sandbox-editor-content.js:226`); `setPinStyle`, `getPinStyle`; `place()`
  (`examples/website-sandbox.js:659`); `actions.detach`; the controller's own `show` and
  `toggleCollapse` (`examples/website-sandbox-sidebar-inspector.js:88-101`).
- **Steps:**
  1. `clonePin(session, pin, {offset})` in `lib/sandbox/pin-ops.js`: take `serializePin(pin)`, strip
     every `id` recursively, offset root x and y, call
     `restoreTree({traitRegistry, applyPinStyleMap}, session, [node])`, then
     `reparentPin(dup, pin.parent)`. Do not use `getAllContents()`; it is a deprecated alias
     (`src/pins/pin.js:322-323`) that S11.2 deletes.
  2. Expose `actions.duplicate(pin)` from `builderActions`, routed through `place()`. Delete
     `duplicateCurrentPin` and the dead `state.show` call at L537. Wire the `onDuplicate` option.
  3. Delete `buildTypographySection` and the four dead option constants; mount a second
     `createContentEditor({root, onCommit, only:['text','label','title','as','size','weight','tone']})`.
     This fixes N1 and also the wrong option lists (frontend N4: `lib/text.js:43-48` accepts
     span/p/h1-h4/label, sizes xs to lg, weights medium and semibold).
  4. Radius becomes `setPinStyle(pin, 'border-radius', v ? v+'px' : '')`, read back with
     `parseFloat(getPinStyle(...))`.
  5. Layout goes through `applyLayout` / `layoutOf` / `canHostLayout`, fixing N3's direct
     `pin.layout = null` write at L277, the always-false Free test at L283, the always-true section
     visibility test at L473, and the gap `0` write at L306 which should be `null`. Add grid.
  6. The detach button calls `onDetach` (`actions.detach`); the collapse button calls the controller's
     `toggleCollapse`. Delete the duplicated `refreshGeometry` and `syncPositionLock` at L492-514.
- **Behaviour preservation:** T0.4 group 2 stays green throughout; group 3 flips from red to green. No
  `data-sandbox` or `data-editor` attribute value changes, because 136 `data-sandbox`, 43 `data-editor`
  and 29 `data-creator` selectors are the browser suites' contract.
- **Accept:**
  - T0.4 group 3 is green; group 2 unchanged.
  - `grep -n "JSON.stringify(pin.contents\|element.style\.\|getTrait(\|contents\.\(text\|label\|title\|as\|size\|weight\) =" examples/website-sandbox-sidebar-inspector.js` prints nothing.
  - `grep -c "setPinStyle" examples/website-sandbox-sidebar-inspector.js` is at least 1.
  - `tests/unit/website-sandbox-layout.test.js` and `tests/unit/website-sandbox.test.js` are green.
  - G8 mutation probe on `clonePin`.
- **Deps:** T0.4. Coordinate with T1.3: `clonePin` is the single subtree-clone primitive in lib and
  `instantiateGroup` must call it rather than grow a second one.

### T0.6 Track C finish, batch review slices, first-run seam (trees X, L, P)

- **Goal:** close Phase 10 Track C, review the ungated batch feature group by feature group, and remove
  the test-harness branch from production code.
- **Write-set:**
  - `examples/website-sandbox-theme.js:89` and the shared light-preset module extracted from
    `examples/website.js` (`SITE_LIGHT_THEME`)
  - `lib/sandbox/pin-ops.js` (second slice: `clearSession`), used at `examples/profiles.js:108`,
    `examples/website-sandbox-history.js:110`, `examples/website-sandbox-templates.js:58`
  - new `first-run` seam in `examples/website-sandbox.js`, replacing the `navigator.webdriver` branch at
    L345
  - `tests/browser/website-sandbox-helpers.js:131` (`openSandbox` gains `{ onboarded = true }` through
    `page.addInitScript`)
  - tests: `tests/unit/website-sandbox-theme.test.js:43`, new
    `tests/browser/website-sandbox-theme.test.js`, one new browser test with `onboarded:false`
- **Reuse:** `applyTheme` and `LIGHT_THEME` from `src/graphics/theme.js`; `LIB_LIGHT_THEME`
  (`lib/styles.js:54-61`); `COMPONENTS_LIGHT_THEME`; `reactionsFor(session)`; `pagesFor(session)`.
- **Steps:**
  1. N9: `examples/website-sandbox-theme.js:89` applies the merged
     `{...LIGHT_THEME, ...LIB_LIGHT_THEME, ...COMPONENTS_LIGHT_THEME}`. Move `SITE_LIGHT_THEME` out of
     `examples/website.js` into a shared module so both surfaces use one set.
  2. N15: add `clearSession(session)` covering roots, `reactionsFor(session).clear()`, the pages store
     and `applyTheme(host, null)`. Replace the three copies of "clear canvas" at
     `examples/profiles.js:108`, `examples/website-sandbox-history.js:110` and
     `examples/website-sandbox-templates.js:58`.
  3. New browser test covering the `insert-theme` menu entry, the light toggle, one token edit, reload
     persistence, undo restoring dark, and `window.cloudcanvasWarnings` empty in the export.
  4. First-run seam: onboarding runs when `localStorage['cloudcanvas-sandbox-onboarded']` is absent and
     no profile exists, and sets the flag afterwards. One new browser test runs with `onboarded:false`
     and asserts the webpage template plus an open drawer.
  5. Review the ungated batch in three slices, each its own dev-to-QA-to-commit pass, remediating in
     place on the sprint branch (there is no restore step; the batch is already committed):
     slice 1 Track C (theme panel plus the `lib/sandbox/serialize.js` and `export-static.js` edits),
     slice 2 editor tabs and Styles tab plus `tests/unit/website-sandbox-styles-tab.test.js`,
     slice 3 studio shell (chrome, sidebar, drawer, templates, css) plus the T0.4 and T0.5 tests.
     Every defect found in review becomes a track with a ratchet key and a due phase.
- **Behaviour preservation:** the N15 browser characterization from T0.4 flips from expected-fail to
  pass; nothing else in the T0.4 set changes.
- **Accept:**
  - `grep -rn "navigator.webdriver" examples` prints nothing.
  - `grep -rn "SITE_LIGHT_THEME" examples/website.js` shows only the import.
  - The three "clear canvas" copies are one call each.
  - G1, G2 full suite, G5 per slice.
- **Deps:** T0.4, T0.5.

---

## S11.1 Boundary repairs

### T1.1 Logger seam (trees S, P)

- **Goal:** one dependency-free logging seam so src and lib can stop using `console` without silencing
  anything that is visible today.
- **Write-set:** new `src/log.js`, new `tests/unit/log.test.js`; edit `src/index.js` (export
  `createLogger`, `setLogSink`, `consoleLogSink`, `LOG_LEVELS`) and `src/pins/reactions.js:247-250`.
- **Placement:** a dependency-free leaf at the src root, because `src/pins` must not import `src/engine`
  after T1.5 and lib needs it too.
- **Shape:** `setLogSink(fn|null, {level})` returns the previous sink. `createLogger(scope)` returns a
  frozen `{debug, info, warn, error}`. Each call builds its record only after the level check, so a
  disabled level allocates nothing. The sink call is wrapped so a throwing sink can never break a frame.
  The logger itself does no I/O. Documented rule: no logging inside `src/engine/frame.js` or the
  `src/engine/renderer.js` phases.
- **Steps:**
  1. Write `src/log.js` and its test.
  2. Export the four names; update the API fixture as a declared diff.
  3. Convert `src/pins/reactions.js:247-250` to `logger.error`, which is preserved exactly by the
     default sink (open decision D10).
  4. Follow-up commit inside the same track: route the silent catches at `debug` or `warn` at
     `src/engine/gesture.js:93`, `src/engine/gesture.js:166`, `src/engine/viewport.js:177`,
     `src/pins/reactions.js:171`, `lib/sandbox/persistence.js:91`, `lib/sandbox/custom-types.js:270`.
- **Behaviour preservation:** the default sink sends `error` to `console.error` and drops everything
  below it, so the reaction-failure message at `src/pins/reactions.js:247-250` still reaches the console
  and the newly routed silent catches stay silent.
- **Accept:**
  - `grep -rn "console\." src --include='*.js'` hits only `src/log.js` (and `src/scripts` until T5.1).
  - The new test proves the sink receives the reaction failure and that a throwing sink is contained.
  - G4 shows exactly plus four names in `src/index.js`.
- **Deps:** open decision D10 must be answered at the S11.1 Definition step.

### T1.2 lib imports only the src barrel (tree L)

- **Goal:** remove the 12 deep `lib` to `src` imports so the boundary rule can be switched on.
- **Write-set:** `lib/list.js:25-34`; `lib/archetypes/{table,media,reactable,document,section}-pin.js:9-11`.
- **Reuse:** every symbol involved is already exported at `src/index.js` lines 34, 48, 62 and 154-169,
  so this is a pure specifier rewrite with no code movement.
- **Steps:** rewrite each deep specifier to `../src/index.js` at the right depth; run G1 after each file.
- **Behaviour preservation:** identical bindings, identical module instances (the barrel re-exports the
  same modules).
- **Accept:**
  - `grep -rnP "from '(\.\./)+src/(?!index\.js')" lib` leaves only the two `group.js` imports, which
    T1.3 removes.
  - G1 and G2 pass.
- **Deps:** T0.2. Precedes T1.3.

### T1.3 Groups out of the base, onto the real serializer (trees S, L, P)

- **Goal:** `src` stops owning a product concept and stops touching `localStorage`; group stamping
  reuses the one lossless subtree serializer.
- **Write-set:**
  - delete `src/pins/group.js`; edit `src/index.js:171-180` (drop the 7 group exports)
  - new `lib/sandbox/groups.js`, new `lib/sandbox/storage.js`
  - edit `lib/sandbox/serialize.js` (`restoreTree` gains an optional fifth `parent` param and a depth
    guard), `lib/sandbox/index.js:71-79`, `lib/archetypes/section-pin.js:11`
  - rename `tests/unit/group.test.js` to `tests/unit/lib-sandbox-groups.test.js`
- **Reuse:** `serializePin` (`lib/sandbox/serialize.js:263`) already carries id, z, paint order, style,
  reload and selectableText. `restoreTree` already rebuilds with a warnings collector
  (`lib/sandbox/serialize.js:372-374`). `clonePin` from T0.5 is the id-stripping primitive.
- **Steps:**
  1. `storage.js` is one namespaced-key store with `save`, `load`, `list`, `delete`. It removes the
     storage guard duplicated at `lib/sandbox/persistence.js:41`, `lib/sandbox/custom-types.js:69` and
     `src/pins/group.js:17`.
  2. `restoreTree` gains the `parent` param and a depth guard that warns past 256, which also closes
     TESTSEC-15 for snapshots.
  3. `groups.js`: `serializeGroup` returns `{version, root: serializePin(pin)}`; `instantiateGroup`
     deep-clones through the T0.5 id-stripping path (defect C: a duplicate id silently shadows the first
     Pin at `src/pins/manager.js:142`), overrides root x and y, calls `restoreTree`, and returns
     `{pin, warnings}`; `loadGroup` shape-validates and warns on corrupt JSON.
  4. Delete `src/pins/group.js` and its exports last.
- **Behaviour preservation:** two deliberate format changes, acceptable because the group format never
  shipped: the gap key is `gap`, not `layoutGap`, and `instantiateGroup` returns `{pin, warnings}`
  instead of a bare Pin. Both are declared in Design and in the CHANGELOG.
- **Characterization tests, written first:** a rotated, styled, z-ordered group round-trips; stamping
  twice yields disjoint ids; the parent override nests; an unknown trait warns; malformed data is
  rejected; and a `String(restoreTree)` self-containment test guards the `export-static.js:139` embed.
- **Accept:**
  - `grep -rn "localStorage" src --include='*.js'` hits comments only.
  - The `lib` to `src` barrel rule in `check-boundaries.js` is switched on and passes.
  - G4 shows src minus 7 names, lib sandbox names as declared.
  - `sinks` no longer lists `src/pins/group.js` storage.
- **Deps:** T1.2, T0.5.

### T1.4 Toast: the base emits, the product renders (trees S, L, P; touches X)

- **Goal:** `src` stops building product DOM; the notification becomes an event plus a live-region
  announcement, and lib renders it in both the builder and exported pages.
- **Write-set:**
  - new `src/engine/notifications.js`; edit `src/engine/session.js` (thin `notify` wrapper),
    `src/pins/reaction-actions.js` (delete L239-299, make `notify.run` call `session.notify`),
    `src/index.js`
  - new `lib/toast.js`; edit `lib/styles.js`, `lib/index.js`, `lib/sandbox/export-static.js:136-175`
  - `examples/website-sandbox.js`: one `attachToasts(session)` call
  - tests: `tests/unit/reaction-actions.test.js`, new `tests/unit/lib-toast.test.js`,
    `tests/browser/sandbox.test.js`, `tests/unit/styles.test.js`
- **Reuse:** `session.events` plus `CustomEvent`, following the `focus:changed` precedent at
  `src/engine/session.js:391-399`; `announce()` at `src/engine/announcer.js:187`; the `--cc-tone-*`
  tokens in `lib/styles.js`; the `toString()` embedding technique already used for `restoreTree` at
  `lib/sandbox/export-static.js:139`.
- **Steps:**
  1. `notify(session, message, {variant, source})` announces through the live region, which also fixes
     the missing `aria-live`, and dispatches a `notify` event. It builds no DOM.
  2. `lib/toast.js` exports a self-contained `presentToast` and `LIB_TOAST_CSS`, plus
     `attachToasts(session)` returning a detach function.
  3. `export-static.js` embeds `presentToast.toString()` and `LIB_TOAST_CSS` in the boot script, which
     is the only thing standing between the move and a regression: the exported page boots with only
     `window.CloudCanvas`, the src IIFE (`lib/sandbox/export-static.js:136-175`), and
     `examples/website-sandbox-templates.js` uses `notify` in about 15 bindings (defect E).
  4. Delete `src/pins/reaction-actions.js:239-299` and add the `attachToasts` call in the sandbox.
- **Behaviour preservation:** the same message text and variant reach the user in the builder and in an
  exported page; the browser test asserts the exported page shows a toast for a `notify` binding.
- **Accept:**
  - `grep -rn "cssText\|#22c55e" src/pins/reaction-actions.js` returns nothing.
  - `src/pins/reaction-actions.js` is at most 350 lines.
  - `tests/unit/reaction-actions.test.js` asserts `notify` dispatches and announces and that no
    `.cloudcanvas-toast` node exists.
  - The `styles.test.js` inline-style discipline now covers `reaction-actions.js`.
- **Deps:** T0.2. Precedes T3.8. Satisfies frontend dependency CORE-C.

### T1.5 One-directional engine to pins, and duplicated resolvers (trees S, P)

- **Goal:** `src/pins` stops importing `src/engine` (3 backwards edges against about 10 forward ones,
  defect G) and the two copies of the pin resolver become one.
- **Write-set:**
  - new `src/pins/limits.js`, new `src/pins/pin-lookup.js`
  - move `src/engine/hit-test.js` to `src/pins/hit-test.js`
  - edit `src/engine/mounting.js:25` (becomes a re-export), `src/pins/pin-element.js:19`,
    `src/engine/pointer.js:70` and `:85-91`, `src/engine/keyboard.js:38` and `:447-453`,
    `src/pins/traits/interaction.js:11`, `src/index.js:282`, `src/pins/manager.js:17` and `:198`,
    `src/engine/session.js` (pass an `onProvision` callback), `src/engine/renderer.js:513` (call
    `isFlowParent`), `src/engine/placement.js:243` (becomes `resolvePlaceablePin`),
    `src/engine/navigation.js:42` (becomes `resolveNavigablePin`)
  - tests: `tests/unit/manager.test.js`
- **Reuse:** the callback-passing pattern already used for `loadChildren` at
  `src/engine/session.js:112-116`.
- **Steps:**
  1. Create `src/pins/limits.js` for `MAX_DEPTH`. It cannot live in `pin-scope.js`, which imports
     `pin-element.js` at L17 and would make a cycle.
  2. Create `src/pins/pin-lookup.js` holding the single resolver, and route
     `src/engine/pointer.js:85-91` and `src/engine/keyboard.js:447-453` through it.
  3. Move `hit-test.js`, leaving `src/engine/mounting.js:25` as a re-export so no import site changes.
  4. Replace the "'free' literal, not an import" workarounds at `src/engine/renderer.js:510-513` and
     `src/engine/scope-well.js:120-130` with a direct call to the pins predicate. The comments rest on a
     wrong premise: the engine may import from pins.
  5. Give `src/engine/session.js` an `onProvision` callback so `src/pins/manager.js` no longer reaches
     back into the engine to announce.
- **Behaviour preservation:** `src/engine/pointer.js:70` lacks the `|| null` that
  `src/engine/keyboard.js:38` has; the shared resolver returns `null` in both cases, which is the
  keyboard behaviour and is a declared, tested change. A manager test proves `onProvision` fires with
  the created list and that a session still announces "N items loaded".
- **Accept:**
  - The `src/pins` must not import `src/engine` rule in `check-boundaries.js` is switched on and passes.
  - `grep -rn "'\.cloudcanvas-pin'" src` has exactly one hit.
  - G4 unchanged except `src/index.js:282` if the moved export path changes name (declare it).
- **Deps:** T0.2. Precedes T3.2, T3.5, T3.6.

### T1.6 lib helper dedupe (tree L)

- **Goal:** one `asText` and one `toNumber` in lib instead of 7 and 3 copies.
- **Write-set:** new `lib/coerce.js`; edit `lib/{radio,select,input,progress,slider}.js` and
  `lib/components/{calendar-event,chat-message,media-card,sticky-note,telemetry-gauge}.js`.
- **Reuse:** swap `toNumber` for the existing `primitives.safeNumber` only if every call site passes a
  finite fallback; the semantics differ otherwise, so check each site before swapping.
- **Steps:** add `lib/coerce.js`, replace the copies one file at a time, run G1 after each.
- **Behaviour preservation:** the shared implementations must be byte-equivalent in behaviour to the
  copies they replace; where two copies differ, keep the stricter and note the difference in the commit.
- **Accept:** `grep -rn "^function asText\|^function toNumber" lib` returns nothing; G1 and G2 pass.
- **Deps:** none inside S11.1.

---

## S11.2 Deprecated API removal (0.5.0)

Migrate callers first, which preserves behaviour while the aliases still exist, then delete once. Only
the last step is breaking.

Call-site counts from the core plan's grep: lib 25 sites in 9 files; examples 12 sites; src 1 site at
`src/pins/reaction-actions.js:353`; tests about 270 raw hits in 25 files. The examples count conflicts:
the core plan says `website-examples-demos.js` x3, `website-sandbox-sidebar-inspector.js:533` x1,
`app.js` x4, `gallery.js` x4; the frontend plan enumerates `website-examples-demos.js` 173/245/423,
`gallery.js` 115/164/203/305, `app.js` 545/665 and the sidebar line. Follow the frontend plan, which
cites the lines, and re-grep at track start; the sidebar site is already gone if T0.5 landed.

The test hits include `PinParticle` receivers, for example in `tests/unit/pin-particle.test.js`, so a
blind regex is unsafe: every receiver's type must be checked. Several examples sites sit in event
handlers that no test runs (`examples/app.js:545`, `examples/gallery.js:115`), so QA verifies those by
reading the code.

### T2.1 lib call sites (tree L)

- **Goal:** zero deprecated-alias calls in lib.
- **Write-set:** the 9 lib files the `deprecated-alias` check names at track start.
- **Steps:** swap `getContent` for `contents.get`, `getVectors` for `particle.getVectors()`,
  `getPrimaryVector` for `particle.getPrimaryVector()`, one file per commit-sized slice.
- **Behaviour preservation:** each alias is a pass-through; the canonical call must produce the same
  value including the null and undefined cases.
- **Accept:** `npm run check -- --check deprecated-alias --json` shows zero lib entries; G1, G2 subset.
- **Deps:** T0.2.

### T2.2 examples call sites (tree X)

- **Goal:** zero deprecated-alias calls in examples.
- **Write-set:** `examples/website-examples-demos.js:173,245,423`; `examples/gallery.js:115,164,203,305`;
  `examples/app.js:545,665`; plus anything a fresh grep adds.
- **Steps:** migrate, then read each untested handler and record in the QA report that its receiver is
  the expected type.
- **Accept:**
  - `grep -rn "getAllContents\|\.getContent(\|\.hasContent(\|\.getTrait(\|\.hasTrait(\|\.getChildren(" examples --include='*.js'` prints nothing.
  - G1, G2 studio and site subsets.
- **Deps:** T0.5 (removes the sidebar site). Satisfies frontend dependency CORE-A.

### T2.3 test call sites (tree P)

- **Goal:** the suites stop exercising the aliases, in three reviewed steps.
- **Write-set:** step 1 `tests/unit/pin.test.js`; step 2 `tests/unit/traits.test.js`,
  `tests/unit/cursor.test.js` and the lib tests; step 3 the remainder of the 25 files.
- **Steps:** per file, check each receiver's type; tests that assert an alias itself are deleted, which
  is a declared deletion and needs its line in the QA report.
- **Behaviour preservation:** assertion bodies are not edited, only the call being made. Any changed
  assertion is an escalation.
- **Accept:** G1 pass count drops only by the deleted alias-assertion tests, and QA lists each deletion.
- **Deps:** T2.1, T2.2.

### T2.4 Delete the aliases and cut 0.5.0 (trees S, P)

- **Goal:** the aliases are gone and the version says so.
- **Write-set:**
  - `src/pins/pin.js` L196-200, 272-279, 292-296, 316-323, 363-364, 405-418, 469-470, 485-486, 503-504
  - `src/pins/pin-traits.js` L165-166 and L212-215
  - `src/engine/session.js` L524-527
  - `src/engine/viewport.js` L311-327
  - `src/graphics/primitives/primitives.js` L465-471
  - the alias use at `src/pins/reaction-actions.js:353`
  - plus `resetView`, `focusOn` and the AVIF shim (programme plan S11.2)
  - new `tests/unit/removed-api.test.js`; `package.json` version 0.5.0; `CHANGELOG.md`
- **Steps:** delete, add the removed-API test asserting none of the names exist, bump the version,
  rebuild dist (the banner embeds the version, so the bump forces a rebuild), write the CHANGELOG
  `Removed` entry with a migration table stating honestly that removal was scheduled for 0.4.0 and
  shipped in 0.5.0.
- **Behaviour preservation:** none intended; this is the breaking step, and it is the only one.
- **Accept:**
  - `grep -rn "Removed in 0.4.0\|@deprecated" src --include='*.js'` returns nothing.
  - `npm run check -- --check deprecated-alias` reports zero.
  - QA lists every remaining `\.(alias)\(` hit and shows its receiver is a `PinParticle`.
  - G4 shows exactly the declared removals; `dist-fresh` passes after the rebuild.
- **Deps:** T2.1, T2.2, T2.3. Precedes T3.4 and T3.7 (it removes about 54 lines from `pin.js`).

---

## S11.3 Size and complexity

Behaviour-preserving unless a track says otherwise. The house pattern throughout: free functions that
take their owner first (`flushStructure(renderer)` at `src/engine/mounting.js:84`, all of
`src/engine/navigation.js`); `init<X>State(owner, ...)` helpers (`initReloadState` at
`src/pins/pin-lifecycle.js:23`, `initEditState` at `src/pins/pin-edit.js:35`); and the original module
re-exporting what moved out (`src/pins/pin.js:42-60`, `src/engine/renderer.js:41`) so no import site
changes and G4 stays unchanged.

### T3.1 context-menu.js 933 to about 330 (trees S, P)

- **Write-set:** new `src/engine/z-order.js` (from L60-102), `src/engine/menu-registry.js` (from
  L104-350: built-in items, `MenuRegistry`, the singleton, resolution), `src/engine/menu-placement.js`
  (from L670-784), `src/engine/menu-panels.js` (from L481-668 and L786-819); edit
  `src/engine/context-menu.js` to keep its header, class constants, overlay L352-479, dismissal and
  keyboard L821-933, plus the re-exports.
- **Approach:** move verbatim, then fix imports. No cycle: panels import registry and placement, overlay
  imports panels.
- **Behaviour preservation:** guarded by `tests/unit/context-menu.test.js` and
  `tests/browser/context-menu.test.js`, both unmodified.
- **Optional follow-up, separate commit, not identical:** move `decorateTrigger`'s three inline styles
  at L659-661 into a rule.
- **Accept:** every new file under 500 lines, `context-menu.js` at most 330, G1, G2 full, G4 unchanged,
  four `file-length` baseline keys deleted.
- **Deps:** T0.2.

### T3.2 pin-element.js 833 to about 380 (trees S, P)

- **Write-set:** new `src/pins/pin-layout.js` (from L69-102 and L270-436), `src/pins/pin-targets.js`
  (from L104-109 and L438-512), `src/pins/pin-measure.js` (from L667-833); edit
  `src/pins/pin-element.js` to keep structure, chrome, ARIA and membership and to re-export the three.
- **Constraint:** `pin-layout.js` must not import `pin-element.js`.
- **Behaviour preservation:** guarded by `tests/unit/pin.test.js`, `chrome-toggle.test.js`,
  `layout-mode.test.js` (unit and browser), `reparent.test.js`, `reload*.test.js` and browser
  `flow-anchor.test.js`, all unmodified.
- **Accept:** as T3.1. Precedes T4.1.
- **Deps:** T1.5.

### T3.3 styles-css.js 759 to a composer of about 40 (trees S, P)

- **Write-set:** new `src/graphics/css/host-css.js` (L24-111), `pin-css.js` (L112-356),
  `templates-css.js` (L357-483), `controls-css.js` (L484-758); edit `src/graphics/styles-css.js` to
  compose them.
- **Reuse:** the existing precedent in `lib/styles.js`, which composes
  `LIB_CONTROLS_CSS + LIB_DISPLAY_CSS`.
- **Behaviour preservation:** record the sha256 of `CANVAS_DEFAULT_CSS` before the split and require the
  identical digest after. That digest test is permanent (G6).
- **Accept:** digest identical, each part under 500 lines, G1, G2 full.
- **Deps:** T0.2.

### T3.4 pin.js 608 to at most 480 (trees S, P)

- **Write-set:** `src/pins/pin.js` constructor L63-152, essays L506-554; helpers land in the existing
  companions: `initFlags` local, `scope.initScopeState` (from L100-120),
  `layout.initLayoutState` (from L122-130), `renderOps.initRenderState` (from L132-135).
- **Approach:** T2.4 has already removed about 54 lines. Break the 90-line constructor into helpers that
  keep its write order exactly; `initLayoutState` must stay after `children` exists. Trim the `chrome`
  and `layout` essays at L506-554 to pointers.
- **Behaviour preservation:** field write order is observable through the trait and layout tests; keep
  it identical and say so in the commit.
- **Accept:** `pin.js` at most 480 lines, function-length key for the constructor deleted, G1, G2 full,
  G4 unchanged.
- **Deps:** T2.4.

### T3.5 renderer.js 583 to about 410 (trees S, P)

- **Write-set:** new `src/engine/measure-pass.js` (`readPhase`, `measurePin`, `reflowFlowNeighbours`
  from L302-391), new `src/engine/write-pass.js` (`writeContents`, `applyPosition`,
  `applyPlaneTransform` from L462-561); edit `src/engine/renderer.js` to keep one-line delegates,
  following the existing `_flushStructure` pattern at L293-300, and to turn the constructor into
  module-level `initQueues` and `initPasses`.
- **Hot path:** the loop calls `applyPosition(this, pin)` directly, not through a delegate.
- **Behaviour preservation:** guarded by `renderer.test.js`, `svg-groups.test.js`, `offload.test.js`
  and the idle-frame tests, which assert an idle frame writes nothing to the DOM.
- **Accept:** as T3.1, plus the idle-frame tests unchanged.
- **Deps:** T1.5.

### T3.6 interaction.js 579 to about 230, resizable.js to about 420 (trees S, P)

- **Write-set:** new `src/pins/traits/draggable.js` (from `interaction.js` L91-451), new
  `src/pins/traits/resizable-geometry.js` (from `resizable.js` L49-83 and L426-500); edit
  `src/pins/traits/interaction.js` to re-export `draggable.js`.
- **Behaviour preservation:** `traits.test.js` and the drag and resize browser suites unmodified.
- **Accept:** as T3.1. Satisfies frontend dependency CORE-H (the Phase 13 gesture split needs this
  first or together).
- **Deps:** T1.5.

### T3.7 session.js 549 to about 465 (trees S, P)

- **Write-set:** new `src/engine/session-state.js` with `initSessionState(session, options)` taken from
  `src/engine/session.js:101-189`; edit the constructor to keep option assertion, state init, styles and
  mount in that order.
- **Note:** the constructor is 113 physical lines but 58 code lines, which is why the gate counts code
  lines (process plan D7).
- **Behaviour preservation:** guarded by `tests/integration/session.test.js`, unmodified.
- **Accept:** `session.js` at most 465 lines, the `function-length` key for the constructor deleted,
  G1, G2 full.
- **Deps:** T2.4.

### T3.8 registerBuiltinActions 102 lines to under 20 (trees S, X, P)

- **Write-set:** new `src/pins/reaction-builtins.js` with one module-level definition per action; edit
  `src/pins/reaction-actions.js`; `examples/website-sandbox-templates.js` (the dashboard binding passes
  `updateTitle: true`); new unit tests for `increment-counter` and `notify`, closing PINS-09.
- **Steps:** extract the definitions; cut `navigate-page` (`src/pins/reaction-actions.js:384-403`),
  which is uncommitted work duplicating the committed page-link flow (`focus` with promote on the page
  root, examples commit 3841601) and has no consumer; make the `increment-counter` title rewrite an
  explicit `updateTitle` param.
- **Behaviour preservation:** the title rewrite changes from implicit to opt-in, so every existing
  binding that relied on it must pass the param. Grep the templates and the goldens for
  `increment-counter` before declaring done.
- **Accept:** `registerBuiltinActions` under 20 lines, `grep -rn "navigate-page" .` outside `plans/`
  and `CHANGELOG.md` returns nothing, G4 unchanged, G1 up by the two new tests.
- **Deps:** T1.4, and open decision D6.

### T3.9 Prototype and blueprint, refactor plus bug fixes (trees S, L, P)

- **Goal:** compile the blueprint once, fix defect A and defect D, and harden the generated DOM.
- **Write-set:** `src/pins/traits/blueprint-compiler.js`; new `src/pins/traits/blueprint-bindings.js`;
  new `src/pins/traits/prototype-state.js`; `src/pins/traits/prototype.js` (L25, L174-176, L224,
  L233-267); `lib/archetypes/section-pin.js:41-43`; new
  `tests/unit/blueprint-compiler.test.js`; `tests/unit/archetypes.test.js`.
- **Reuse:** `h()` from `src/graphics/primitives/element.js`; `safeUrl`; the `BINDING_WRITERS` table
  pattern replaces the 5-way `if` chain.
- **Steps:**
  1. Characterization tests that pass on current code: the DOM shape per binding type and the update
     writes.
  2. A failing test for defect A: the descriptor count is identical after 1 build and after 5 builds.
     Today `bindingDescriptors` (`blueprint-compiler.js:30`) is captured by `parseNode`, which pushes at
     L76, 91, 102, 117, 129 and 156 on every `templateFactory(pin)` call (L166-179); a probe measured
     0, 2, 4, 6, 8 over four builds of a two-binding blueprint.
  3. Refactor into a compile-once `planNode` that pre-assigns descriptor indexes plus an
     `instantiate(plan, pin)` that builds nodes through `h()`, which also fixes SVG namespacing
     (REPO-19).
  4. Hardening: `type="button"` default on blueprint buttons; reject `on*` attribute names at compile
     time; pass URL attributes through `safeUrl`; add a `classes` prop for global un-namespaced classes
     (defect D: `['button.cloudcanvas-lib-button', ...]` at `lib/archetypes/section-pin.js:41-43` is
     rewritten to `canvas-section-cloudcanvas-lib-button` by `blueprint-compiler.js:55-57`); replace the
     `if` chain at `prototype.js:233-267` (raw indent depth 7) with `BINDING_WRITERS`; extract the
     default-value expression duplicated at `prototype.js:25` and L174-176.
  5. `definePrototype` drops from 177 lines to an assembler of about 40. It accepts `registry` and
     defers style injection; the D4 namespacing decision is applied; a colliding action name throws.
- **Behaviour preservation:** this track is explicitly a bug fix, not a pure move. The characterization
  DOM goldens must stay identical apart from the four declared hardening changes, each of which gets its
  own test. `src/pins/traits/prototype.js:224` iterates the descriptor array, so N Pins of one archetype
  currently do N times the binding work per update; after the fix the work is constant and the writes
  are the same, because the duplicate writes were idempotent.
- **Accept:**
  - `npm run check -- --check function-length,nesting` is clean for both files.
  - The descriptor-count test passes.
  - `archetypes.test.js` is updated to the decided instance surface.
  - G8 mutation probe on the compile-once path.
- **Deps:** T0.2, open decision D4. Precedes T4.4.

### T3.10 lib serialize.js 519 to about 410, autoSaveSession under 50 (trees L, P)

- **Write-set:** new `lib/sandbox/restore-tree.js` holding L360-470 verbatim; edit
  `lib/sandbox/serialize.js` to re-export it and to delete the duplicated doc line at L105-106; edit
  `lib/sandbox/persistence.js` to fold the key check into a `requireKey(key, caller)` helper.
- **Behaviour preservation:** `restoreTree` must stay one self-contained function, because
  `lib/sandbox/export-static.js:139` embeds `restoreTree.toString()`. The T1.3 `String(restoreTree)`
  self-containment test is the guard, and the `function-length` baseline entry for it is the sanctioned
  `zeroBy: "never"` allow-list entry. `autoSaveSession` (54 lines) is trimmed mechanically, no logic
  change.
- **Accept:**
  - `lib/sandbox/serialize.js` under 500 lines, target about 410.
  - `autoSaveSession` under 50 code lines.
  - `lib-sandbox*.test.js`, browser `sandbox.test.js` and the self-containment test all green,
    unmodified.
- **Deps:** T1.3. Precedes T4.2. Satisfies frontend dependency CORE-E.

---

## S11.4 Registries and archetypes

### T4.1 LayoutRegistry (trees S, L, P)

- **Goal:** layout modes become an open set without changing any built-in behaviour.
- **Write-set:** new `src/pins/layout-registry.js`; edit `src/pins/pin-layout.js`,
  `src/engine/scope-well.js:128`, `src/pins/reparent.js:187`, `src/index.js`,
  `lib/sandbox/restore-tree.js`, `lib/archetypes/section-pin.js`; new tests.
- **Reuse:** mirror `TraitRegistry` at `src/pins/traits/registry.js:51-160` exactly: `register`, `get`,
  `has`, `unregister`, `list`, `clear`, `_initDefaults`. In `restore-tree.js`, use `api.layoutRegistry`
  when present and fall back to the literal otherwise, the same guard shape as `applyPinStyleMap` at
  `lib/sandbox/serialize.js:462`.
- **Definition shape:** `{name, flow, className, axis}`.
- **Behaviour preservation:** `setLayout` still throws on an unknown mode; `pin._layoutFlow` stays
  cached so the per-frame check remains a property read; `LAYOUT_MODES` and `LAYOUT_CLASS` remain as
  frozen views of the built-ins.
- **Accept:** a custom mode registers, flows, serializes and restores; `clear()` restores the built-ins;
  G1, G2 full, G4 plus the declared new export names.
- **Deps:** T3.2.

### T4.2 Reload strategy registry (trees S, L, P)

- **Goal:** replace 8 identity-check branch sites with one descriptor table, and stop `restoreTree`
  crashing on an unknown `reload` value (defect B).
- **Write-set:** new `src/pins/reload-registry.js`; edit `src/pins/reload.js:105-123`,
  `src/pins/pin-lifecycle.js` L27, 32, 54, 116, `src/pins/manager.js:172`, `src/pins/pin.js:227`,
  `src/pins/traits/graph.js:121`, `lib/sandbox/restore-tree.js`, `lib/sandbox/custom-types.js:63`.
- **Descriptor:** `{name, restingMode(pin), bornActive, wakesWithParent(pin), provisions}`.
- **Steps:**
  1. Characterization first: a table test of the resolved mode across strategy, `active`,
     `_provisioned`, participating and `_offloadDormant`, frozen on current behaviour.
  2. Convert each branch site to a descriptor read, one site per commit-sized slice, rerunning the table
     test each time.
  3. `restoreTree` warns and falls back to `'active'` on an unknown value instead of letting
     `createPin` throw. Today `lib/sandbox/serialize.js:401` passes `node.reload` straight through and a
     probe with `reload:'bogus'` threw `TypeError: Unknown reload strategy`, which breaks `restoreTree`'s
     own "collected, never thrown" contract at L372-374.
- **Behaviour preservation:** `RELOAD_MODES` stays a closed set for the built-ins; the table test is the
  contract and must not change. This track carries the highest regression risk in the programme, so QA
  runs the full browser suite and a G8 probe on two branch sites.
- **Accept:** the table test is unchanged and green; a `reload:'bogus'` node restores with a warning and
  no throw; G1, G2 full, G4 plus declared names.
- **Deps:** T3.10, open decision D5. If D5 is declined, the track shrinks to the `restoreTree` fallback
  fix alone and stays in S11.4.

### T4.3 Custom-type traits as an open set (trees L, X, P)

- **Write-set:** `lib/sandbox/custom-types.js:50` and `:159-162`; `placeCustomType` in
  `examples/website-sandbox-widgets.js`; new `attachableTraitNames(registry)` in lib.
- **Steps:** the loader keeps any non-empty trait name, deduplicated, and stops dropping one that is
  unknown at load time, because a component library may register its traits later. The placer attaches
  the ones that are registered and warns on the rest. `attachableTraitNames(registry)` excludes display
  definitions (`ctor === DisplayTrait`; `defineComponent` always registers that way,
  `lib/define-component.js:71`).
- **Behaviour preservation:** `CUSTOM_TYPE_TRAITS` stays exported as the default offered set, so the
  creator UI is unchanged. Existing saved types with known traits behave identically.
- **Accept:** a type saved with an unknown trait name round-trips, places with a warning, and attaches
  once the trait is registered; G1, G2 studio subset.
- **Deps:** none inside S11.4.

### T4.4 Archetypes finished or trimmed (trees L, P)

- **Write-set:** new `lib/archetypes/registrar.js`; edit `lib/index.js`,
  `lib/archetypes/{table,section,media,reactable,document}-pin.js`,
  `src/pins/traits/prototype-state.js` (a `derive` schema rule); tests per archetype.
- **Reuse:** mirror `makeRegistrar` at `lib/components/registrar.js:15-40`: memoised per registry,
  styles injected on attach, not at import.
- **Steps:**
  1. `registerArchetypes(registry)` re-exported from `lib/index.js`.
  2. A `derive` schema rule in `prototype-state.js` recomputes derived fields in `update`.
  3. Table: derived `total`, retitled "ledger", the "spreadsheet" claim dropped.
  4. Section: drop `layoutMode` and `childCount`, cycle through `layoutRegistry.list()`, fix the save
     import and the button classes (defect D, fixed by T3.9's `classes` prop).
  5. Media: `emoji` and `image` modes only, `img` src through `safeUrl`, consume `--cc-pin-rotation`,
     remove the `rotatePin` call which writes `angle` outside the schema, drop `spriteFrame`.
  6. Reactable: `aria-pressed` bound to `saved`.
  7. Document: derived `readingTime`, rendered.
- **Behaviour preservation:** none of this ever shipped, so the constraint is forward-looking: importing
  the module must register nothing, and every archetype must survive a serialize then restore
  round-trip.
- **Accept:**
  - For each archetype: a test per declared action plus a round-trip test.
  - `checkStyleDiscipline` over the generated CSS reports zero violations.
  - Importing `lib/archetypes/index.js` registers nothing (assert the registry is untouched).
  - G4 records the `lib/archetypes/index.js` surface as declared.
- **Deps:** T3.9, T1.3, T4.1, open decision D6.

---

## S11.5 Packaging, dist and docs

### T5.1 One package truth (trees P, S, L, X)

- **Goal:** one published package, one canonical org, nothing untracked or stale in the tarball.
- **Write-set:**
  - `package.json`: replace the `NeoTecLLC` URLs in `repository`, `homepage` and `bugs` with
    `CloudsEcosys/cloudcanvas`; add `GUIDE.md` to `files` (DOC-24)
  - `src/package.json`: `private: true`, renamed `cloudcanvas-base`, `exports`, `files` and the build
    script removed
  - delete `src/dist/`, `src/scripts/build.js`, `src/package-lock.json`, `src/node_modules`; add
    `dist/` to `.gitignore` in S
  - `.gitmodules`: the three URLs move from `NeoTecDigital` to `CloudsEcosys`
- **URL form:** absolute `CloudsEcosys` URLs, not the relative `../cloudcanvas.git` the core plan
  recommended. Relative submodule URLs resolve against the parent's own origin, and the owner has
  decided the parent never gets one.
- **Naming conflict:** the core plan names the private src manifest `cloudcanvas-engine-src`; the
  approved programme plan says `cloudcanvas-base`. Follow the programme plan.
- **Behaviour preservation:** `npm test` and `npm run test:browser` must be unaffected; nothing imports
  `src/package.json`, and `package-exports.test.js` from T0.2 proves every remaining target resolves.
- **Accept:**
  - `npm pack --dry-run` lists no `src/dist` and no `src/node_modules`, and does list `GUIDE.md`.
  - `grep -rn "NeoTecLLC\|NeoTecDigital" . --exclude-dir=node_modules --exclude-dir=.git` returns
    nothing.
  - `npm run check -- --check exports-resolve` exits 0.
- **Deps:** T0.2.

### T5.2 Build and dist freshness (tree P)

- **Write-set:** `scripts/build.js` (add `--check`: build with `write:false`, then byte compare);
  `package.json` (`check:dist` script, wired into G2); new `dist/cloudcanvas.css` emitted by the build;
  `package.json` `exports` entry `./styles.css` repointed at it; one new test asserting the IIFE
  global's keys equal the ESM export names.
- **Rationale:** `dist/` is load-bearing for tests. `tests/browser/sandbox.test.js:211` and `:244` fetch
  `/dist/cloudcanvas.iife.js` and `examples/website-sandbox.js:94` feeds the same bundle to Export
  (defect F), so `scripts/build.js`'s header claim that dist "may be stale without affecting npm test"
  is false for `test:browser`. Dist stays committed and is rebuilt in every S-changing step.
- **Pitfalls:** the banner embeds the `package.json` version and homepage, so the T2.4 version bump and
  the T5.1 URL change both force a rebuild; esbuild output is only reproducible after `npm ci`.
- **Accept:** `npm run check:dist` exits 0 on a clean tree and exits 1 after touching one src file
  without rebuilding; `./styles.css` resolves to a real stylesheet; G2 includes the check.
- **Deps:** T5.1.

### T5.3 Dev server hardening (tree P)

- **Write-set:** `scripts/dev-server.js` L48 (`SERVED_FILES` gains `GUIDE.md`), L109 (CORS).
- **Steps:** drop the wildcard CORS header unless `HOST=0.0.0.0`; add `fs.realpathSync` containment;
  refuse `node_modules`.
- **Accept:** `curl -s -o /dev/null -w '%{http_code}' localhost:8090/GUIDE.md` returns 200; a
  `../../etc/passwd` style path returns 403; `curl -I` shows no
  `Access-Control-Allow-Origin: *` on a localhost bind. G7 applies (this track touches the server).
- **Deps:** none.

### T5.4 CHANGELOG audit (tree P)

- **Write-set:** root `CHANGELOG.md`; `src/CHANGELOG.md` becomes a pointer in T5.5.
- **Steps:** root `CHANGELOG.md` is canonical from S11.0 onward and each track appends its own entry.
  This track audits completeness against `git log` across P, S, L and X and adds the missing entries:
  undo/redo, Pages, reactions, per-Pin appearance, community types, slotted types, theme, prototype and
  blueprint and archetypes, groups, toast and notify, logger, registries, removals. It also fixes the
  date order: 0.4.0 is dated 2026-09-03 and 0.3.0 is dated 2026-09-04, which runs backwards (open
  decision D9 says which is wrong).
- **Accept:** dates are monotonic; every removed alias has a Migration line; `docs-api` on the CHANGELOG
  is zero.
- **Deps:** open decision D9.

### T5.5 Docs truth (tree P, plus S and L pointer files)

- **Write-set:** `ARCHITECTURE.md` (sections 1, 2.22, 2.25 to 2.28), `GUIDE.md` (section 7),
  `README.md`, `lib/README.md`, `src/README.md`, `src/ARCHITECTURE.md`, `src/CHANGELOG.md`; new
  doc-lint test.
- **Steps:**
  1. Re-derive ARCHITECTURE 2.25 to 2.28 and GUIDE 7 from the code. Remove `session.selectPin`,
     `isAncestorOf`, `detachPin`, `pin.emit` and the "Webpage 1200x800" preset. These describe src and
     lib, so they belong in this track and not in the frontend plan.
  2. Document reactions and per-Pin appearance; restore the GUIDE sandbox paragraph (DOC-16); fix
     ARCHITECTURE 2.22 (DOC-04).
  3. Regenerate the section 1 tree from `find`, including `lib/`.
  4. Fix the widget count and remove hard-coded test counts.
  5. Install instructions state truthfully that the package is unpublished.
  6. `lib/README.md`: add the `./sandbox` export and rows for `pages`, `slotted-type`, `groups`, `toast`
     and archetypes.
  7. `src/README.md`, `src/ARCHITECTURE.md` and `src/CHANGELOG.md` become short pointers carrying the
     copyright header (TESTSEC-24), which also clears the three `headers` violations.
- **Accept:** `npm run check -- --check docs-api,headers` exits 0; every backticked identifier that
  looks like an export resolves in the G4 fixture lists; no hard-coded test count remains.
- **Deps:** T5.1 for the install URLs, T5.4 for the CHANGELOG.

### T5.6 Close (tree P)

- **Steps:** final `npm run build`, `npm run verify:full`, and reduce `scripts/quality-baseline.json` to
  the sanctioned `zeroBy: "never"` allow-list. Then run the phase-exit gate below.
- **Accept:** `node scripts/check-quality.js --phase-exit cleanup` exits 0.
- **Deps:** every other track.

---

## Defects found during planning

Each was read at the cited lines by the planning agents. Items A, C and D describe uncommitted code that
is now committed in the WIP snapshot.

| # | Defect | Evidence | Fixed in |
|---|---|---|---|
| A | The blueprint compiler is not compiled once and its descriptor list grows without bound | `src/pins/traits/blueprint-compiler.js:30` is captured by `parseNode`, which pushes at L76, 91, 102, 117, 129, 156 on every `templateFactory(pin)` call (L166-179). A probe measured 0, 2, 4, 6, 8 over four builds of a two-binding blueprint. `src/pins/traits/prototype.js:224` iterates the same array, so N Pins of one archetype do N times the work per update and leak. Nothing visibly breaks because the writes are idempotent, but the "zero-allocation compiled blueprint" header claim is false | T3.9 |
| B | `deserializeSession` throws on an unknown `reload` value | `lib/sandbox/serialize.js:401` passes `node.reload` straight into `createPin`; a probe with `reload:'bogus'` threw `TypeError: Unknown reload strategy`, breaking `restoreTree`'s "collected, never thrown" contract at L372-374 | T4.2 (or T3.10 if D5 is declined) |
| C | A duplicate Pin id silently shadows the first Pin | `src/pins/manager.js:142` does `this.pins.set(pin.id, pin)`; a probe confirmed `getPin` then returns the second Pin. `restoreTree` replays `id: node.id`, so any re-stamping path must strip ids first | T0.5 (`clonePin`), T1.3 (`instantiateGroup`) |
| D | Archetype buttons are unstyled | `['button.cloudcanvas-lib-button', ...]` at `lib/archetypes/section-pin.js:41-43` is rewritten by `blueprint-compiler.js:55-57` to `canvas-section-cloudcanvas-lib-button`. The blueprint has no way to name an un-namespaced class | T3.9 (`classes` prop), T4.4 |
| E | Moving the toast regresses exported sites unless the export embeds a presenter | The exported page boots with only `window.CloudCanvas`, the src IIFE (`lib/sandbox/export-static.js:136-175`), and `examples/website-sandbox-templates.js` uses `notify` in about 15 bindings | T1.4 (embed `presentToast.toString()`) |
| F | `dist/` is load-bearing for tests | `tests/browser/sandbox.test.js:211` and `:244` fetch `/dist/cloudcanvas.iife.js`; `examples/website-sandbox.js:94` feeds the same bundle to Export. `scripts/build.js`'s header claim that a stale dist does not affect `npm test` is false for `test:browser` | T0.2 (`dist-fresh` in G2), T5.2 |
| G | Layering direction is engine to pins, about 10 edges, with only 3 backwards | The "'free' literal, not an import" comments at `src/engine/renderer.js:510-513` and `src/engine/scope-well.js:120-130` rest on a wrong premise; the engine may import the pins predicate directly | T1.5 |
| H | `navigate-page` is redundant | `src/pins/reaction-actions.js:384-403`, uncommitted until the snapshot, duplicates the committed page-link flow (`focus` with promote on the page root, examples commit 3841601). No consumer found by grep, and "Page" is a lib concept that should not live in src | T3.8, subject to D6 |
| N1 | The sidebar's "Typography and Content" section writes nothing | `pin.contents` is a `Map` (`src/pins/pin.js:94`), but `examples/website-sandbox-sidebar-inspector.js` L331-334, 353, 373, 390 use `'text' in contents` and `contents.text = val`. Checked in node: `'text' in new Map([['text','x']])` is `false`, and the expando write leaves `map.get('text')` unchanged. Populate at L460-468 fails the same way, so the section stays hidden except for text pins and is never filled | T0.5 |
| N2 | Duplicate throws after it has created the Pin | `examples/website-sandbox-sidebar-inspector.js:537` calls `state.show(dup)`, but `show` lives on the returned controller (L88-101). It also creates the copy at the root even when the source is nested, using parent-local x and y, drops children, style overrides, `bordered`, `reload` and every trait except resizable, and uses the deprecated `getTrait` alias at L533 | T0.5 |
| N3 | Sidebar layout section defects | L277 writes `pin.layout = null` directly; the Free button can never light up because the `pin.layout` getter returns `'free'` (`src/pins/pin.js:543`) so `!layout` at L283 is always false; `pin.layout || ...` at L473 is always truthy so the section shows for every Pin; there is no grid mode; L306 writes gap `0` where the contract uses `null` | T0.5 |

## Open owner decisions

Already settled and not repeated here: the parent remote and repo naming (core D1, process D1), trunk
(process D2), co-author trailers (process D3), the Stage 0 snapshot exception (process D4), no
grandfathering (process D5, implemented as the `"ungated": true` baseline marking), ff-merge
pre-authorisation (process D6), `arts/` and hand-off artefacts out of git (process D12, core D12), the
XSS layering (core D2, locked by the programme plan's three-layer T0.3), the `restoreTree` allow-list
entry (core D3), a dependency-free gate parser (core D11, locked by the programme plan's
"dependency-free"), committed dist (core D7, implied by G2 reading `dist/`), and a real
`dist/cloudcanvas.css` (core D8).

| # | Decision | Recommendation from the reports | Needed by |
|---|---|---|---|
| D4 | Prototype instance surface | `pin.actions.<name>` plus `pin.state`, dropping the `pin.emit` and `pin.rotate` grafts, because authors already receive `pin` and can call `pin.transmit` or `rotatePin`. Alternative: promote `emit` to a real `Pin` method | T3.9 Definition |
| D5 | Reload strategies as a registry | Convert, as a descriptor table. Highest regression risk in the programme, 8 branch sites, characterization table first. If declined, do only the `restoreTree` crash fix | T4.2 Definition |
| D6 | Feature cuts | TablePin becomes a two-line ledger with a derived total and no row collection; MediaPin keeps `emoji` and `image` only; SectionPin drops `childCount` and `layoutMode`; cut `navigate-page`; make the `increment-counter` title rewrite an explicit opt-in param | T3.8, T4.4 |
| D9 | CHANGELOG date order | 0.4.0 is dated 2026-09-03 and 0.3.0 is dated 2026-09-04. Say which is wrong | T5.4 |
| D10 | Logger default sink | Errors go to `console.error`, everything below is dropped. That exactly preserves `src/pins/reactions.js:247-250` and keeps failures visible; a strict no-op default would silence it | T1.1 Definition |
| D7p | Function-length metric | Code lines, not physical. Physical lines reward deleting JSDoc, and the session constructor is 113 physical but 58 code lines | T0.2 |
| D8p | Test files in the ratchet | Freeze only: no growth, no new file over 500, and exempt tests from function-length and nesting | T0.2 |
| D9p | Allowed barrels | Add `lib/components/index.js`: it is in the exports map and examples import it 5 times | T0.2 |
| D10p | Ratchet due dates | Examples CSS, HTML and the legacy demos (`app.js`, `gallery.js`, `website.js`) are `zeroBy: "pre-figma"`, which is now the Phase 15 exit | T0.2 |

The `p` suffix marks process-plan decisions, to keep them distinct from the core plan's numbering.

## Phase-exit gate and 0.5.0 release policy

1. `node scripts/check-quality.js --phase-exit cleanup` exits 0, with the baseline reduced to the
   sanctioned `zeroBy: "never"` allow-list.
2. Three consecutive full-suite runs pass: `npm run verify:full` three times, 0 fail, 0 skipped.
3. Fresh-clone proof: `git clone --recurse-submodules` into a scratch directory, `npm ci`,
   `npm run verify:full`.
4. The adversarial multi-dimension review finds zero confirmed critical or high issues. Mediums are
   fixed or deferred by the owner.
5. Docs pass: `docs-api` is zero; every fixture export is documented or on an accepted list; no doc
   carries a hard-coded test count; the CHANGELOG has a Migration line per removed alias and monotonic
   dates.
6. PDL: S11.0 to S11.5 all closed with retrospectives, phase at 100 percent.

Release 0.5.0, which is breaking at 0.x because the aliases are gone:

- One release commit per repo bumps the version, rebuilds dist (the banner embeds the version) and
  updates the site version string.
- Merge to `main` in src, then lib, then examples, then the parent, ff-only, and push `main` to the
  three origins. That push is pre-authorised once QA has passed.
- Annotated `v0.5.0` tags on all four repos, pushed explicitly, are an owner action and are not
  pre-authorised. Ask at the time. Never move a pushed tag; fixes go to 0.5.1.
- `npm publish` is an owner action and is not part of this phase.
- Parent-only `checkpoint/11.N` tags mark each sprint and stay local.
- Final re-bundle of all four repos after the merges.

## Risk register

| Risk | Mitigation |
|---|---|
| Regressions from file splits | The facade keeps the old module path, existing tests stay unmodified, the G4 API snapshot catches surface drift, and the full browser suite runs on every src track |
| Save-format drift | Immutable goldens in both directions. A `SANDBOX_FORMAT_VERSION` change is an escalation. T1.3's two format changes are declared up front because the group format never shipped |
| The reload registry breaking lifecycle behaviour | Characterization table test frozen on current behaviour before any branch site moves, one site per slice, G8 probes, full browser suite. Fallback is the crash fix alone (D5) |
| The blueprint refactor changing generated DOM | DOM goldens per node kind written first, four declared hardening changes each with its own test, descriptor-count test as the fix's own guard |
| The toast move regressing exported sites | `presentToast` is embedded by `toString()`, the same technique already proven for `restoreTree`, and a browser test opens an exported page with a `notify` binding |
| Submodule pointer mistakes | Bottom-up commits, `git diff --cached --submodule=log --stat` before the parent commit, the `pointers` check, ff-only merges, never amending after a pointer bump |
| No parent remote, so no off-disk copy | Mandatory re-bundle of all four repos at every sprint close, `git bundle verify` on each, plus the preflight tarball |
| Publishing unreviewed work | Sprint branches are never pushed to the public src and lib origins; only QA-passed `main` is pushed |
| Agent collision | Single committer, rule of one with the build lock held through QA, banned destructive commands, the `cloudcanvas-locks` notepad board |
| Stale dist tested by the browser suite | `dist-fresh` runs inside `npm run check`, before the browser tests; dist is rebuilt and committed in every S-changing step |
| Trailer or signing slips | Post-commit `%G? %ae` and trailer check on every commit, the `commits` check at Launch, and the owner-side harness attribution setting |
| The gate itself being wrong | Exit 3 on a tokeniser imbalance, never a verdict. Scanner unit tests, `stats` assertions so a matcher that finds nothing cannot pass, and the baseline generated twice and diffed |
| Long browser suite | Subset map (engine, studio, site), explicit full-suite triggers, 300 s cap, run in the background during diff review |
| MODULES.md scope creep | Those docs stay out of scope; any item from them entering a track is an escalation, and `headers` fails on their attribution line |
| Redirect-only submodule URLs | T5.1 rewrites `.gitmodules` to absolute `CloudsEcosys` URLs, and the same track clears the `NeoTecLLC` URLs from root `package.json` |

## QA log

One row per QA pass, appended by the QA agent. Columns: date, track, QA agent, the four HEAD SHAs, check
exit code, unit N/N, browser set and N/N and seconds, scope verdict, findings, overall verdict.

| Date | Track | QA | SHAs (P/S/L/X) | check | unit | browser | scope | findings | verdict |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-17 | T0.1 | n/a, sanctioned exception | 85f58a6 / 10aaf0f / 0fb6a75 / 93b2853 | n/a | 874/874 | not run | n/a | snapshot only | recorded |
