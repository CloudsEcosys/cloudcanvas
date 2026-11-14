<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 10 — Builder Fundamentals

Four tracks closing the gap between "Sandbox with good primitives" and "full webpage
builder and diagramming tool." One at a time, dev → QA → fix → re-QA per track
(concurrent agents on this working tree caused a real git collision earlier this
session — don't repeat that).

## Track A — Undo/Redo
No undo/redo exists anywhere; no central command dispatch (~18 scattered mutators).
Snapshot-based via the existing `serializeSession`/`deserializeSession`
(`lib/sandbox/serialize.js`), gesture-boundary granularity, hooked off the existing
`context.profiles.markDirty()` seam. New `examples/website-sandbox-history.js`.
Ctrl+Z/Ctrl+Shift+Z, guarded the same way `website-sandbox-tools-controller.js`
already guards native contenteditable undo. Known/accepted: trait live state isn't
round-tripped (confirmed nothing built-in needs it).

## Track B — Pages (Sitemap) + Component Instance Push-Update
Pages need no new engine primitive: promoting a root Pin already isolates it from
every sibling root (`RenderRootScope.allows`) — that's page isolation for free. Add
a name + home-flag field per root Pin (`serialize.js`), a new
`examples/website-sandbox-pages.js` panel, and reuse the reactions system's
already-shipped `focus` action for page links (no new action type).

Component instances: a placed custom-type Pin carries zero identity back to its
type today. Add a `typeName` field, plus an explicit "Update all instances from
master" action (not live-link — override-tracking is deliberately deferred).
Slotted types need a forced rebuild (not just content update) when slot count
changes, since the `DisplayTrait` rebuild signature doesn't key on content shape.

## Track C — Page Appearance: Layout & Theme, exposed
`pin.layout` (free/row/column/grid) is real and working with zero Sandbox UI to
change it — confirmed by direct grep, zero hits. Theme (`applyTheme`/`LIGHT_THEME`,
`src/graphics/theme.js`) only wires at the outer site level, never inside the
Sandbox. Both are additive UI over already-correct primitives: a layout field in
`website-sandbox-editor.js`, and a new theme panel built on the `TOKENS`
introspection layer (`src/graphics/tokens.js`) — light/dark preset plus a
color-category editor calling the existing `applyTheme`.

## Track D — Local Data Source + Repeater
The one track needing real new plumbing (confirmed): flat-literal `pin.contents`
has no bound-value concept, `lazy`/`loadChildren` is run-once/destroy-to-reset
(wrong lifecycle), reactions are edge-triggered off Pin signals (wrong trigger
model for live data). `addChild`/`removeChild` and per-Pin dirty-cache isolation
are confirmed safe/cheap — the missing piece is one utility, not a broken
foundation. v1 rebuilds the child set on every data change rather than diffing
incrementally (Richard's steer: ship the everyday stuff first). Storage reuses the
exact `persistence.js`/`custom-types.js` namespaced-localStorage pattern.

## Order
A → B → C → D, one agent at a time, QA-gated. D last since it's the largest/most
novel and benefits from A-C's banked history.
