<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 9 — Backlog Closure

Every open item from Phases 6-8 and Sprints 7.x-8.2, driven to done. Five
disjoint tracks, parallel, QA-gated, committed. One deliberate exception below.

## Track A — Core correctness batch (src/)
`createCanvasSession({container: null})` validated (throw, not silent no-op).
Deprecated Pin alias call sites (~39, `getContent`/`getTrait`/etc. → canonical)
migrated across `src/`. `package.json` exports map gains `./sandbox`.
`autoSaveSession(session, key, …)` reordered to `(key, session, …)` to match
its four `persistence.js` siblings - update every call site.

## Track B — Theming + z-order persistence
`BADGE_SURFACE` (`src/graphics/primitives.js`) is a hard-coded dark hex,
bypassing the token system - badges/alerts render dark-only in light mode.
Route it through `--cc-badge-*` tokens with real light-mode values, contrast-
checked ≥4.5 both themes (reuse `checkStyleDiscipline`/`contrastTextFor`).
Z-order (`bringToFront`/`sendToBack`, `context-menu.js`) moves DOM siblings but
never touches the model, so it doesn't survive `serializeSession`/reload -
make DOM order the one source of truth `serializePin` reads, consistent with
this project's own "the DOM is the model" stance, rather than bolting on a
second order field.

## Track C — `lib/components/` remediation
The pre-built pin-board library (sticky notes, task cards, telemetry gauges,
flow nodes, workspace groups, media cards, breadcrumb bar, chat messages,
calendar events) predates the base `lib/` kit's tokenization/contrast/native-
control-first pass and never got it. Bring it up to the same bar `lib/README.md`
already promises is coming: `--cc-*` token-only styling, ≥4.5 contrast both
themes, native controls where the widget implies one, `defineComponent`
throughout.

## Track D — Flow-child position lag (investigate, fix if clean, else report)
A flow child's `globalBoundsOf` still sums particle x/y, irrelevant once
layout places it - connectors/cursors anchored to it can lag. A real fix
needs the write phase to read live layout, which breaks the deliberate
read/write split from Phase 8's dirty-cache design. Attempt a fix that
doesn't compromise that split (e.g. a live-geometry read gated to exactly the
consumers that need it); if none exists cleanly, report precisely why and
propose the least-bad mitigation rather than forcing a break.

## Track E — The guide
The original ask, never delivered: "a proper guide in the docs on how to
utilize and get the most out of this framework." A real `GUIDE.md` (or
integrated more substantively into the site's How It Works tab) - not a
restatement of ARCHITECTURE.md's technical reference, a task-oriented
walkthrough: building your first Pin, the trait system, chrome/bordered/
layout, the Sandbox as a worked example, when to reach for `lib/` vs core.

## Deliberate exception - not in this phase
`pin-element.js`/`styles-css.js`/`interaction.js`/`pin.js`/`renderer.js` are
all over the 500-line guideline and grew across the last several sprints.
Splitting them is pure reorganization with no functional benefit, in the five
most heavily-exercised files in the codebase, right after a run of core
surgery already landed in them. Real regression risk for zero user-facing
gain - deferred, not silently dropped. Flagged plainly rather than forced.

## Order
All five tracks are file-disjoint enough to run in parallel (A/B share no
files with C/D/E; A and B both touch nothing D or E touch). QA gate once all
land, fix any cross-track finding, commit.
