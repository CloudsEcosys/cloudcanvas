# Changelog
<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

All notable changes to CloudCanvas. Versions follow semantic versioning; this file
records the migration surface, not the commit history.

> **Repository scope.** This is the changelog for the whole CloudCanvas system. This repository
> ships the **core engine only**; entries below that describe the base widget kit / components
> (`lib/`, `cloudcanvas/lib`, `cloudcanvas/components`, `cloudcanvas/sandbox`) or the sandbox /
> site builder (`examples/`) refer to the sibling repositories
> **[NeoTecDigital/cloudcanvas-lib](https://github.com/NeoTecDigital/cloudcanvas-lib)** and
> **[NeoTecDigital/cloudcanvas-site](https://github.com/NeoTecDigital/cloudcanvas-site)**.

## Unreleased

### Added

- **`Pin.rebuildDisplay()` - force a display to lay out a new content *shape*.** The ordinary
  render path rebuilds a Pin's subtree only on a display-type swap or the `html` override
  toggling, because those are the only structure changes a built-in template has: a card is
  always title-over-body, whatever the values. A `defineComponent` template whose `build`
  reads the content *shape* - the slotted custom type lays out one region per slot - has a
  fourth kind of change the display signature (its fixed trait name) cannot see, so after its
  contents change shape a plain `setContents` writes into a subtree built for the old shape.
  `rebuildDisplay()` discards the built subtree and asks for a content frame, so the next
  render constructs the new shape. It is a no-op on a Pin with no display trait and safe to
  call repeatedly. The trait-level primitive it drives, `DisplayTrait.discardBuild(pin)`, is
  public too - `rebuildDisplay` is the Pin-level spelling.
  *Migration*: none - additive; a Pin never rebuilt implicitly still renders identically.

- **`pin.layout` and `pin.layoutGap` - a container that lays its children out.** A Pin
  option and a live get/set pair: `'free'` (the default, and what every existing Pin is)
  keeps today's absolute positioning, where each child is placed by its own transform;
  `'row'`, `'column'` and `'grid'` lay the **scope well** out with real CSS flex or grid
  and let the children flow. Structurally it is the twin of `chrome`, one level down -
  one class, live-settable, mirrored from a flag the Pin holds so a headless Pin still
  remembers what it was asked for - but written onto the scope well rather than the root,
  because layout is about how a Pin arranges *its children*, not how the Pin itself sits.
  `'free'` carries no class at all, so an untouched card's stylesheet output is byte for
  byte what it was. `layoutGap` is the gap in canvas pixels, written as the
  `--cc-layout-gap` custom property all three modes read; `null` (the default) leaves the
  sheet's own `--cc-space-2` spacing in place. An unknown mode throws a `TypeError` rather
  than silently leaving the container free.
  Exported alongside them: `LAYOUT_MODES`, `LAYOUT_CLASS`, `FLOW_CHILD_CLASS` and
  `LAYOUT_GAP_PROPERTY`, so a consumer styling or testing a flow container names the same
  strings this does.
  *Migration*: none - `layout` defaults to `'free'`, and reading it on any existing Pin
  reports what that Pin already was.

- **`is-flow-child`, and the transform the renderer stops writing.** A child of a
  non-`free` container is positioned entirely by its parent's flex or grid flow, so it
  wears one class - `position: relative`, `top/left: auto` - and `_applyPosition` declines
  to write it a transform at all. `relative` rather than `static` deliberately: `z-index`
  is inert on a static box and both `is-dragging` and `cc-elevated` raise a Pin through
  it, so a reorder drag would stop elevating. The class is kept in step by `syncFlowChild`
  from every path that can change a Pin's parent (`addChild`, `removeChild`, and so
  `reparentPin` through them) and from `setLayout` for each existing child, so switching a
  container to a flow mode re-flows the children it already has, not only future ones.
  Crossing that boundary clears two things in both directions, and both are load-bearing:
  the transform already on the element (a `position: relative` box still honours one, so a
  leftover would visibly mis-place the child - `relative` does not neutralise it), and the
  renderer's applied-position cache (`clearAppliedPosition`, new on `ConjugateRenderer`),
  without which the transform a Pin needs on its way *back* to free layout would be
  skipped as unchanged against a stale entry.
  Two rules keep a flow container honest about *size*, which is the part that is easy to
  get wrong. Each mode states its cross-axis alignment (`align-items: flex-start` on row
  and column, `align-items`/`justify-items: start` on grid) rather than taking the
  browser's `stretch`: a Pin's size is its own, and since the measurement pass writes
  rendered boxes back into particles, a stretching flow would silently overwrite every
  child's height in a row and its width in a column or grid. And `ScopeWellPass` writes
  **no measured `min-height`** for a flow parent - that number is `max(child.particle.y +
  height)`, which for a flow child is a position nothing renders at any more - leaving the
  flow itself to size the well, with `--cc-scope-min-height` as the only floor.
  *Migration*: none - a Pin whose parent is free is never a flow child, and a free well is
  still sized exactly as before.

- **`reorderChild(container, pin, beforeSibling)` and `insertionSiblingFor(container, pin,
  event)` - in-place ordering inside a flow container.** Beside `reparentPin`, because a
  reorder is the same drag gesture staying inside its own parent - and deliberately *not*
  routed through `removeChild`/`addChild`: the Pin is already a child, so there is no
  relinking, no renderer re-attach, no coordinate conversion and no well to settle. Only
  order changes, and it changes in two places at once because two layers read it: the
  browser paints the DOM, and `serializeSession` walks `Pin.children`. That `Set`'s
  iteration order *is* insertion order and a `Set` has no insert-at-index, so the order is
  rebuilt by clearing and re-adding in sequence; the element moves with a single native
  `insertBefore`, which relocates rather than clones. `insertionSiblingFor` turns a drop
  point into the reference sibling - horizontal for a row, vertical for a column or grid,
  each sibling's midpoint read live off `getBoundingClientRect` because a flow child's
  particle x/y no longer describes where it renders. `DraggableTrait` consults it ahead of
  its own same-parent no-op guard, so a drop inside the flow container a Pin already
  belongs to reorders it instead of doing nothing; a Pin in a free container never reaches
  that branch, so ordinary dragging is untouched.
  *Migration*: none - additive, and inert outside a flow container.

- **`renderStaticHtml(snapshot, {page})` - export a page built to a device size.**
  `lib/sandbox/export-static.js` takes an optional `page: {width, height}` in CSS pixels,
  threaded unchanged through `buildStaticSite`, `exportStaticSite` and
  `downloadStaticSite`. Without it the mounted root fills the window exactly as before
  (`position: absolute; inset: 0; width: 100vw; height: 100vh`, the document
  `overflow: hidden`); with it the root is a box of that size, centred and scrollable
  (`position: relative`, the stated width and height, `max-width: 100vw; margin: 0 auto`),
  which is the box the Sandbox's new windowed mode composed the canvas in. The exported
  session still mounts with its camera at rest, so canvas (0, 0) is that page's top-left
  corner. The viewport meta stays `width=device-width` either way - the right declaration
  for a page *built* to a device size, and a fixed `width=` would only fight it. A `page`
  that is given but is not two positive finite numbers throws a `TypeError`: a caller who
  meant to size the page and mistyped it must not silently get a window-filling one.
  *Migration*: none - the option is opt-in and its absence is the previous output, byte
  for byte.

- **Sandbox: windowed mode, and a Layout section in the editor.** The builder's toolbar
  gains a *Windowed* toggle that draws a device-sized frame on the plane (Mobile, Tablet,
  Laptop, Desktop, or Custom) and flies the camera to fit it; the frame is a composition
  guide rather than a clip, its size is what the ZIP export is built to, and the mode is
  deliberately not part of the saved profile - it is how the canvas is being looked at,
  not what is on it. The editor gains a Layout section (`Children` and `Gap`), offered to
  any Pin that can hold children and writing only through `pin.layout` / `pin.layoutGap`;
  a child of a flow container has its X and Y hidden in the editor with the reason stated
  and disabled in the quick-panel with the reason as its tooltip, which is the same
  refusal the read-only offload rows already make. One consequence is stated because it is
  a layout invariant, not a preference: in the full-screen shell the toolbar is now
  `flex-wrap: nowrap` with a horizontal-scroll fallback. A session measures its host box
  at mount and on a window resize only, so a bar that grew a second row as the view
  controls appeared would move the host under a cached measurement and put the context
  menu, the offload sweep and every drop point on a stale box.

- **`pin.chrome` - the whole card, toggled live.** A Pin option (`chrome: false`) since
  0.2.0, now also a real get/set pair, exactly as `bordered` became one in 0.4.0. Where
  `bordered: false` withholds only the border, `chrome: false` takes the entire card
  away - surface, padding, radius, shadow and border - which is what a component that
  draws its own surface needs, and painting the default card first is both a wasted
  frame and a fight that component has to win back in CSS.
  Structurally it is the same shape as `bordered`: one class (`cloudcanvas-primitive-card`)
  on the root element, mirrored from a flag the Pin holds, so a headless Pin still
  remembers what it was asked for. **The two-child `.content + .scope` structure is
  built once and identically either way**, so toggling chrome is a class-level change
  with content preserved *by construction* - it is not a structural rebuild, and
  `contentElement` and every node inside it survive by identity across any number of
  toggles.
  One deliberate difference from `bordered`, and it is the whole reason the setter is
  not a copy of it: `bordered` is `border-color: transparent`, which moves no geometry,
  while chrome is real padding, a real border *width* and a shadow - so dropping or
  restoring it **changes the layout box**. The particle, any connector anchored to this
  Pin's centre, and the scope well it sits in all read that box, so the setter ends in
  `invalidate('content')` - the same debt `resizePin` pays for a resize - and `bordered`
  correctly does not.
  At setup the class list is the authority rather than the flag, because `rootClassName`
  suppresses the card not only for `chrome: false` but for a caller's own `className`
  and for an adopted element that never passed through the builder at all; the flag is
  read back from the element there, and the live setter is the only thing that writes it.
  *Migration*: none - `chrome` defaults to `true`, and reading it on any existing Pin
  reports what that Pin already was.

- **The chromeless grab handle - a drag surface for a Pin that is all control.**
  `DraggableTrait` now builds a small grip at the Pin's top-left corner
  (`GRAB_HANDLE_CLASS`, exported) whenever the Pin is chromeless *and* its own surface
  is a real control. That combination is exactly the hole `chrome: false` opened: a
  `lib/` Button's Pin **is** a `<button>`, and `DraggableTrait` stands down on a real
  control on purpose (a button that moves the card it sits on is a button nobody can
  press) - so before this there was nothing left to grab such a Pin by at all.
  Wiring mirrors `ResizableTrait`'s handles exactly: a direct child of the Pin's
  **root** (so it rides the transform and a content re-render never removes it),
  visibility through the `hidden` property driven off the one `select` signal rather
  than a poll, and full removal from the DOM - never merely hiding - when it is not
  needed. It is deliberately **not** `data-cc-control`, which is the one difference from
  a resize handle and the entire point: initiating a drag is its job.
  The gate is chrome plus a control surface, read as the content node's first element
  child. A chromed Pin is draggable by its padding and header already; a chromeless
  *non*-control - a divider, a bare adopted section - is draggable by its whole face.
  Neither builds a handle, so the ordinary canvas pays one flag test per render.
  *Migration*: none - additive, and invisible to every Pin that is not chromeless.

- **`reparentPin(pin, newParent, position)` - move a live Pin between scopes.** The
  nest/detach primitive, a free function taking the Pin first beside `resizePin` and
  `rotatePin`. `newParent` is the Pin to nest under, or `null` to promote back out to
  the canvas root - one primitive, two directions, and the two are the same operation
  with the source and target roles reversed. **Never a rebuild**: the Pin instance
  survives untouched - its `traits` Map, its particle, its selection and drag state, its
  element and every listener on it - and only two things change, which scope holds it
  and where inside that scope it sits.
  The membership half is reused rather than reimplemented (`addChild`/`removeChild`
  already relink the graph, move the element between scope wells, re-attach the renderer
  and wake the subtree). What they do not do is convert coordinates, and that conversion
  is the whole of what this adds: `position` is a **canvas-space** top-left, and it is
  turned into the new parent's local space through `scopeOriginOf` - the parent's global
  corner plus its cached scope-container offset, which is the inverse of the
  per-ancestor sum `getGlobalBounds` walks, stopped one level up. Omitting `position`
  keeps the Pin exactly where it already is, which is what a drop wants.
  Guards: a Pin is never its own parent, and **never a child of its own descendant** -
  the cycle check walks `ancestors()` and rejects the move rather than corrupting the
  tree. A no-op (already at root, asked for root) is rejected too.
  The parent a Pin *leaves* is explicitly recomputed. A departed child leaves no dirt of
  its own behind, so the vacated well would otherwise stay sized and outlined for a
  child that is gone; `removeChild` does not touch it, so a live reparent invalidates it
  through the renderer's own well pass when one is attached and synchronously otherwise.
  The new parent needs no such nudge - the moved Pin is dirty this frame.
  *Migration*: none - new API. Serialization is unchanged: a reparented Pin round-trips
  with no serializer change, because parentage was always read from the graph.

- **Drag-to-nest and drag-to-detach, on the drag gesture already there.** A finished
  drag that comes to rest over a different scope is promoted from a plain move into a
  reparent, in `DraggableTrait.onPointerUp`. The release point is resolved by
  `droppablePinAt(session, event, {ignore})` (also exported) - a new core hit-test that
  reads `document.elementsFromPoint` **deepest-first**, because a nested Pin's element
  sits inside its parent's well and is therefore the topmost thing painted there, and
  skips the dragged Pin's whole subtree, because a Pin can be dropped neither into
  itself nor into one of its own descendants. In a layout-less DOM the event's own
  `target` stands in, which is how a caller with no geometry names a drop.
  `target === pin.parent` is the regression lock: a drag ending over open root canvas
  (both `null`) or back inside its current parent does nothing at all, so it stays the
  plain move the last `onPointerMove` already committed. A click that never crossed
  `DRAG_THRESHOLD_PX` reparents nothing, and neither does a cancelled drag - which is
  the same missing-event convention `cancelDrag` and `onDetach` already used.
  The point handed to `reparentPin` is the Pin's own current canvas-space corner, so a
  drop keeps it exactly where the user let go with no visible jump.
  One ordering fix came with it: `onPointerUp` in the pointer router now clears
  `DRAG_CHAIN_CLASS` **before** routing to traits. `setElevationChain` walks
  `pin.parent`, so removing the class after a drop would strip the *new* chain and
  strand the class on the old one. This is the order `cancelDrag` already used.
  *Migration*: a drag that ends over another Pin now nests instead of overlapping. Pass
  no `DraggableTrait`, or intercept `drag:end`, if a canvas wants the old behaviour.

- **`offload` - opt-in DOM virtualization on the viewport axis.** A per-Pin option
  (`offload: true`) whose element is detached from the document once its global box has
  left the visible canvas by more than a margin, and reattached the moment the camera
  brings it back. Model, particle, traits, contents and measured size are all retained:
  this is virtualization, **not** destruction, and no lazy provider is re-armed (that is
  `unload()`, a heavier and separate thing).
  Orthogonal to `reload`, not a value of it: a Pin can be `reload: 'lazy'` *and*
  `offload: true`, because one decides when a scope's children are first created and the
  other decides whether an existing element is currently worth keeping in the document.
  The margin is `offloadMargin` - per Pin (honoured even at `0`), falling back to a
  session-level `offloadMargin` option, falling back to `DEFAULT_OFFLOAD_MARGIN` (400px,
  exported).
  The mechanism is deliberately not new: the pass raises `pin._offloadDormant`, which
  makes `resolveRenderMode` resolve the Pin to `unmounted`, so detach and reattach travel
  the exact same structure-flush path a sleeping scope already used. Two invariants shape
  it - **root-only evaluation** (detaching a root takes its whole subtree with it, so
  nested Pins ride their root rather than being tested one by one) and **camera-gated**
  (the sweep runs only when the viewport version moved, or when a new offload Pin was
  just adopted), which is what preserves the idle-canvas-zero-writes guarantee: a still
  camera does no offload work at all. A reattached Pin re-queues content and measurement
  like any freshly mounted Pin, so it renders current state rather than the state it left
  with.
  *Migration*: none - `offload` defaults to `false` and a canvas with no opted-in Pin
  never enters the sweep.

- **`lib/sandbox/custom-types.js` - user-defined Pin presets in `localStorage`.** The
  fifth module in `lib/sandbox/`, and the first one that is not about a *session*:
  `saveCustomType(definition)` / `getCustomType(name)` / `listCustomTypes()` /
  `deleteCustomType(name)`, with `normalizeCustomType` and `customTypeContents` for
  placing one, plus `CUSTOM_TYPE_KEY_PREFIX`, `CUSTOM_FIELD_KINDS` and
  `CUSTOM_TYPE_TRAITS`. All re-exported from `lib/sandbox/index.js`.
  A definition is a **recipe** - `{name, fields, traits, chrome, bordered, reload,
  width, height}` - not a display trait. Placing one is `session.createPin(...)` with
  those defaults spread in plus the named trait attachments: the same calls a
  hand-built Pin makes. **Nothing is registered with the trait registry**, which is
  the point: a page that never loads this module still renders a saved instance, as a
  card, rather than dropping it.
  It takes its **own key namespace** (`cloudcanvas-custom-type:`) rather than sharing
  `persistence.js`'s. A type is global to the origin - made once, expected in every
  profile - so it must not live inside a profile's snapshot; and `listSandboxKeys()`
  defines "a saved sandbox" as *any* key under the sandbox prefix, so a type stored
  there would show up in the Load menu as a profile that cannot be opened. One prefix
  per concern keeps both enumerable sets honest.
  Every read normalises on the way out, so a definition written by an older page still
  loads: an unknown field kind falls back to `text`, an unknown reload strategy to
  `active`, field keys de-duplicate first-wins, and traits are filtered to the
  attachable set. `listCustomTypes` **skips** an entry that fails to parse rather than
  throwing - one stale key must not take a whole menu down with it - and sorts by name.
  The storage guard is `persistence.js`'s exactly: no `localStorage` returns rather
  than throws.
  *Migration*: none - a new, additive module. Nothing in `src/` imports it and
  importing it registers nothing.

- **`parent` - nested submenus in the canvas context menu.** `registerMenuItem` takes a
  fifth field, `{id, label, when, action, group, parent}`, naming another command this
  one nests under; `''` (the default) is the top level. `MenuRegistry` grows
  `hasChildren(id)` and `childrenOf(id)` beside `has` / `get` / `list`, and two new
  exported class names come with it: `MENU_FLYOUT_CLASS`
  (`cloudcanvas-context-menu-flyout`) for a submenu panel and `MENU_ITEM_SUBMENU_CLASS`
  (`cloudcanvas-context-menu-item--submenu`) for the trigger that opens one. Both are
  re-exported from `src/index.js` beside the four class names that were already there.
  **Trigger status is derived, never declared.** A command that at least one other
  command names as its `parent` *becomes* a submenu trigger: it renders with a caret and
  opens a flyout instead of running. There is no `submenu: true` flag to keep in step
  with the children, and because a child of a flyout may itself be some third command's
  parent, the same mechanism composes to **any depth** with no per-level code.
  Two authoring mistakes are refused at registration rather than papered over, which is
  the same contract the duplicate-id throw already set:
  a `parent` that **is not yet registered** throws, so the graph stays an acyclic forest
  and its render order stays top-down; and naming a parent that **already carries an
  `action`** throws, because a command cannot be both a trigger and a command.
  `action` therefore became optional - but only for a trigger, since a leaf with no
  action is invisible.
  **An empty category never renders.** Visibility recurses: a trigger shows when its own
  `when()` passes *and* at least one descendant would itself show, so a category whose
  every child is gated out by `when` does not appear as a caret that opens onto nothing.
  The recursion is what makes that judgement reach arbitrarily deep for free.
  The root panel is still the one persistent element built at `mount()`; **flyouts are
  transient** - created on open, removed on close - because there may be zero or many
  and their contents are per-opening. Only one branch is open per level, so opening a
  trigger closes any sibling's flyout while leaving every ancestor exactly where it is.
  Both the root and every flyout are positioned through **one** shared helper, so the
  edge clamp that keeps the menu inside the host box is identical for all of them.
  Keyboard, on top of the buttons' native Enter / Space / Tab: **Escape now steps back
  one level** while a flyout is open and only closes the whole menu at the top - the
  app-menu convention - Up/Down rove within the focused panel and wrap, Right opens the
  focused trigger's flyout and steps into it, Left closes the flyout focus is in and
  returns to its trigger. `aria-haspopup` / `aria-expanded` are maintained on every
  trigger.
  *Known limitation*: a flyout with no room to its right is **clamped** back inside the
  host rather than flipped to the trigger's left, native-menu style. Every item in the
  innermost panel stays on screen and clickable, but within roughly two panel widths of
  the host's right edge the panels stack on top of one another and the trigger that
  opened one is covered by it. See *Notes*.
  *Migration*: none - `parent` is optional and every existing flat registration is
  unchanged. One behaviour note for anyone driving the menu by keyboard: Escape inside
  an open submenu now closes that submenu instead of the whole menu.

- **Shift+A quick-search in the Sandbox: the insert catalogue as a typed-at list.**
  A second door onto the same catalogue the right-click tree offers
  (`examples/website-sandbox-quicksearch.js`). The chord opens a centred native
  `<dialog>` shown modally - the rest of the page inert, focus trapped, Escape the
  platform's own cancel - listing every insertable item, built-in and custom, filtered
  live against **label *and* category** as the visitor types. Up and Down move the
  highlight and wrap; Enter places the highlighted item at the middle of the host box;
  Escape places nothing. A click on a row places that row.
  The list is read from `insertableItems()` **fresh on every opening** and placement goes
  through the builder's one `insert(item, point)` command - the same call the menu's
  leaves make - so the two doors cannot drift and a type saved a moment ago is
  immediately placeable from both.
  The chord is taken on the document and refused in three cases: the builder is not on
  screen (`enable` / `disable` follow the tab's `show` / `hide`, so Home, How It Works
  and Examples never see it), the press came from an input, textarea, select or anything
  `contenteditable` - Shift+A there is a capital A, not a command - or a dialog is
  already open, which covers the editor, the creator and this overlay itself.
  *Migration*: none - example-application behaviour, and `Shift+A` collides with nothing
  the library binds (`src/engine/keyboard.js` binds no letter key; Shift there only
  multiplies the arrow pan).

- **`cloudcanvas/sandbox` - the sandbox utilities as their own entry point.**
  `lib/sandbox/` (serialize, persistence, zip, export-static, custom-types) has been
  importable by relative path since it shipped; `package.json`'s `exports` map never
  named it, so an installed package could not deep-import it at all. Added alongside
  `./lib` and `./components`, same shape.
  *Migration*: none - additive.

- **A real usage guide.** `GUIDE.md`, a task-oriented walkthrough - your first Pin, the
  trait system, `chrome`/`bordered`/theming, composing a real layout with `pin.layout`
  and `reparentPin`, when to reach for `lib/` versus core, the Sandbox as a worked
  example - linking into `ARCHITECTURE.md` for the technical detail rather than
  restating it. Every example in it runs against the current source; linked from the
  site's How It Works tab.

### Changed

- **Live connectors route edge-to-edge instead of centre-to-centre.**
  `connectorPathData` gains a second call form: passing two Pin global-bounds objects
  (`{minX,maxX,minY,maxY,centerX,centerY}`) instead of four numbers routes the curve out of
  the box face nearest the target - horizontal or vertical dominance chosen by the larger
  centre delta, control points pushed 40% of the gap (min 40px) - so a connector meets each
  node's border rather than diving through it. `ConnectableTrait` now feeds bounds directly.
  *Migration*: none - additive; the four-number form is unchanged and still draws the
  centre-to-centre curve.

- **A missing `container` throws instead of mounting nothing.**
  `createCanvasSession({ container: null })` (or `undefined`, `''`, a non-element)
  used to succeed silently and render nothing - the session existed, `hostElement` was
  never set, and there was no error to chase. `container` is now validated wherever a
  session reads it (construction, and `mount()` directly): a `TypeError` names the
  option and states what was received, and says outright that omitting the key
  entirely is how you mount later with `session.mount()` - which is unaffected, since
  that path is "no `container` given," not "a bad one."
  *Migration*: a call that relied on the old silent no-op (there is nothing to rely on
  in "renders nothing," so this should only ever surface a real bug) now throws instead.

- **`autoSaveSession(key, session, options)` - argument order matches its siblings.**
  Every other `lib/sandbox/persistence.js` export takes `(key, session)`;
  `autoSaveSession` shipped as `(session, key, options)` last sprint. Reordered for
  consistency before anything outside this repo could depend on the old order.
  *Migration*: breaking, pre-1.0. Swap the first two arguments at every call site.

- **Badge and Alert render correctly in light mode.** `toneSurface()` composited a tone
  hue over `BADGE_SURFACE`, a hard-coded dark hex - so every tone was a dark chip
  regardless of theme, and light mode got a dark blob with barely-readable text. The
  fill is now the tone hue itself at a translucent alpha, composited live over
  whatever surface it sits on rather than baked against one; the foreground reuses the
  existing `--cc-badge-text-override` token (already correct in `LIGHT_THEME`) instead
  of a second new one. No observer was added - the adaptation is the browser
  recompositing a translucent fill under a changed token, which happens for free on a
  theme toggle. Every tone in both widgets now clears ≥4.5:1 in both themes (measured
  low: 7.85, dark theme, warning).
  *Migration*: none - visual only, and strictly a correction.

- **Z-order survives save, reload and export - at every level, not only within a
  container.** `bringToFront`/`sendToBack` already moved the real DOM element;
  `serializeSession` read `Pin.children`'s Set order for nested children (fixed once)
  and `getRootPins()`'s registration order for roots (the gap that fix missed, found in
  this sprint's own QA gate) - so a root-level reorder, the common case in the
  Sandbox, still came back exactly as it was created after every reload. Both levels
  now read the actual paint order - the plane's real children for roots, a scope
  well's for nested ones - consistent with this project's own stance that the DOM is
  the model, rather than adding a second order field that could drift from what is
  actually on screen.
  *Migration*: none - a saved snapshot with no meaningful prior order restores exactly
  as before; only an actual reorder is now remembered.

- **A flow child's reported position is its rendered one, not its stale particle.**
  `pin.layout`'s flow children are placed by CSS, not a transform, so `globalBoundsOf`
  summing particle x/y for one no longer described anything real - a connector, the
  cursor, or a reparent drop point could read the wrong place. Fixed inside the
  existing read phase, not by breaking it: a `position: relative` scope well with no
  border or padding is a flow child's `offsetParent`, and its content origin
  coincides exactly with the origin a free child's transform is measured from - so
  `element.offsetLeft/offsetTop`, captured once per frame alongside the size
  measurement already taken there, is directly interchangeable with the free-child
  math. Re-measurement is triggered only when a flow container or one of its children
  actually changes size or content this frame - a settled row/column/grid costs zero
  extra work, the same dirty-driven guarantee the rest of the renderer holds.
  *Migration*: none - every consumer of a Pin's global bounds gets the corrected value
  automatically; nothing called this out by name before.

- **`lib/components/` is remediated to the base kit's bar.** The nine pin-board widgets
  are `defineComponent` templates now, not `PinTrait` subclasses: build once, mutate
  after, keyed lists reconciled (`reconcileKeyedList` for a task's checklist and a
  message's reactions), a no-op re-render writing nothing, `allowedKeys` closed. Every
  control is native - checklist rows are `<input type="checkbox">` + `<label for>`,
  reactions and colour swatches are `aria-pressed` `<button>`s, the sticky note's editor
  is a `<textarea>` built once and opened under `pin.beginEdit`, both progress bars are
  `<progress>`, the composer is a `<form>` - and every one honours `--cc-control-min`.
  The sheet (`styles.js`, split into `styles-cards-css.js` + `styles-board-css.js` +
  `styles-comms-css.js`) reads
  only `var(--cc-*, <dark default>)`, carries no `:root` block, and passes
  `checkStyleDiscipline` whole (254 literal colours and 23 unprefixed classes before).
  Variants ride `data-theme` / `data-priority` / `data-status` / `data-severity` and
  `is-done` / `is-pulsing`, not bare modifier classes. Eleven new theme-dependent tokens
  (`--cc-priority-{urgent,high,normal,low}`, `--cc-status-{nominal,warning,critical}`,
  `--cc-severity-{critical,high,normal,info}`) have light values in
  `COMPONENTS_LIGHT_THEME`; every text-on-surface pair in the library measures 4.5:1 or
  better in both themes (`tests/unit/lib-components-styles.test.js`). Every widget that
  draws its own surface is `chrome: false` (the double card is gone); `workspace-group`
  alone keeps the core card, because its children sit in the core's scope well.
  *Migration*: the `*Trait` classes (`StickyNoteTrait`, `TaskCardTrait`, ...) are gone;
  a Pin is created by the same `create*Pin` factory, or by name after
  `registerComponentTraits()`, and each widget's behaviour is a function taking the Pin
  - `trait.startSimulation(pin)` → `startTelemetrySimulation(pin)`, `trait.setReading`
  → `setTelemetryReading`, `trait.transmitPulse` → `transmitFlowPulse`,
  `trait.acknowledge` / `resolve` → `acknowledgeCalendarEvent` / `resolveCalendarEvent`,
  `trait.navigateBack` → `navigateBreadcrumbBack`. Telemetry thresholds (`warn`, `crit`)
  and the breadcrumb's `rootName` are contents now, so they survive a snapshot. Selectors:
  `.severity-critical` → `[data-severity="critical"]`, `.btn-ack` / `.btn-resolve` →
  `.cloudcanvas-event-ack` / `.cloudcanvas-event-resolve`, `.pulse-glow` → `.is-pulsing`,
  `.theme-pink` → `[data-theme="pink"]`, `.cloudcanvas-color-dot` →
  `.cloudcanvas-sticky-swatch`, `.current` → `.cloudcanvas-breadcrumb-current`.
  `SnapToGridTrait` rides the `drag:end` signal instead of `onPointerUp`, which never
  saw a real drag (the default drag trait had already cleared its flag). `EditableTrait`
  inserts its input *beside* the title under the edit lock rather than replacing the
  title's children, which left every later title update writing into a detached node.

- **`autoSaveSession(session, key, options)` is now `autoSaveSession(key, session, options)`.**
  A breaking signature change, pre-1.0. Its four `persistence.js` siblings all lead with the
  sandbox key - `saveSandbox(key, session)`, `loadSandbox(key, session)`,
  `listSandboxKeys()`, `deleteSandbox(key)` - and the auto-saver was the one that led with the
  session, so a caller reaching for the family got one of them backwards. It now matches.
  *Migration*: swap the first two arguments -
  `autoSaveSession(session, 'current', opts)` becomes `autoSaveSession('current', session, opts)`.

- **The Sandbox tab's widget palette is gone, replaced by the canvas's own right-click
  menu.** This is a **behaviour change to the example application**, not to the library:
  the sidebar of draggable widget tiles introduced in 0.4.0 no longer exists, and
  widgets are inserted by right-clicking empty canvas and choosing one. It is recorded
  here because anyone who used that tab, or copied its palette code, will find it
  moved.
  The builder now registers one `insert-<widget>` command per catalogue entry through
  the existing `registerMenuItem` registry, `when: (s, {pin}) => !pin` so they appear on
  empty canvas only, placing at `session.viewport.screenToCanvas(context.x, context.y,
  rect)` - under the pointer at every zoom and pan. **No `src/` change was needed to
  allow this**; the menu registry shipped in 0.4.0 was already the intended extension
  point, and this is the first consumer to use it as a primary interface rather than a
  garnish. The palette had to be dragged *from* and its drop converted; the menu is
  already at the destination, and the canvas gets its full width back.
  A second group of Pin-scoped commands joins them: *Edit...*, *Hide chrome* / *Show
  chrome* (two items whose `when` are complements, because a label is fixed at
  registration), *Detach from container* (only with a `pin.parent`) and *Delete*. Each
  runs the same function the editor's own buttons run, so a command cannot drift
  between the two surfaces.
  *Migration*: for consumers of the library, none. For anyone driving the Sandbox tab:
  the `[data-widget]` palette tiles no longer exist; use a right-click.

- **The Sandbox Inspector is now a quick-panel plus a full editor modal.** The old
  single property sheet is split in two, deliberately unequal. The quick-panel keeps
  what changes under the pointer - X / Y / Width / Height, *Edit...* and *Delete* - and
  nothing else, because it floats over the canvas and one that held everything would be
  a sidebar again. The editor modal is the complete surface for one Pin: position and
  size, chrome and border, the trait picker with live resize options, reload strategy,
  contents, and a danger zone carrying Detach and Delete.
  Every control writes through the Pin's **public** surface - `setPosition`,
  `resizePin`, `pin.chrome`, `pin.bordered`, `addTrait` / `removeTrait` /
  `replaceTrait('resizable', options)`, `pin.reload`, `setContent` - never the particle
  or the element. Content fields are typed by a per-widget schema (text, number,
  checkbox, enum `<select>`, and a real list editor with add and remove) with a generic
  key-value fallback typed off the value, which is what makes *every* Pin editable,
  including a Container or a custom type this code has never heard of.
  `offload` and `offloadMargin` are shown **disabled, with the reason beside them**:
  the renderer reads `pin.offload` once, when it adopts the Pin, and the snapshot does
  not carry it, so a live control there would be a switch that does nothing.
  Two behaviours worth knowing: neither panel rebuilds a field the pointer is inside
  (both geometry refreshes skip `document.activeElement`), and an editor write refreshes
  the quick-panel, because they show the same box.
  *Known tradeoff*: unchecking `selectable` closes the **click** route to that Pin -
  the builder's selection follows the `select` signal, which only a `SelectableTrait`
  emits - so it leaves the selection set and the quick-panel with it. The **right-click**
  route stays whole: the menu resolves the Pin from the click's own element chain and
  asks no trait anything, so Edit, the chrome toggle, Detach and Delete all still reach
  it. Locked by a browser test.

- **"+ New Type" in the Sandbox insert menu: a creator for custom Pin types.** Name,
  default width and height, chrome / border / reload defaults, a list of default content
  fields (text, number or checkbox), and the traits an instance is born with. Saved
  types appear in the insert menu below the built-in widgets, survive a reload, and
  carry a Delete in the creator - since nothing else on the page can take one back out.
  Backed by `lib/sandbox/custom-types.js` above.
  *Known limitation*: an instance's **type identity is not serialized.** `serializeSession`
  captures trait names, and a custom-type instance's traits are the ordinary
  `card` / `draggable` / `selectable` set, so a snapshot restores it as a generic card.
  Verified end to end: the restored Pin keeps its position, size, chrome, border and
  **all of its contents**, is selectable and draggable, and edits through the generic
  content fallback - what it loses is only the label saying which recipe made it.
  Carrying the identity means a `customType` key in the snapshot format and a resolution
  step on restore; that is a format change and is deliberately not made here.

- **The Sandbox insert menu is a `+ New ▸ Category ▸ Item` tree, and every widget now
  carries a category.** The flat list of `insert-<widget>` commands added above is
  restructured onto the `parent` field: one root trigger, `+ New`; one trigger per
  category actually in use; one leaf per item under its category. `+ New Type...` stays
  at the top level, after the tree. This is a **behaviour change to the example
  application** - the library change it rests on is the `parent` field above.
  The taxonomy is three built-in categories - **Basic** (the eight form controls),
  **Display** (text, badge, avatar, divider, progress, spinner, alert, list) and
  **Layout** (the Container) - plus whatever the visitor's custom types file under.
  A custom type's `category` is a **new field on the definition**
  (`lib/sandbox/custom-types.js`): free text, so a type may join a built-in category or
  coin its own, defaulting to `Custom` and exported as `DEFAULT_CUSTOM_CATEGORY`. The
  creator gained a category `<select>` over every category in use whose last option,
  *+ New category...*, reveals a text field for a name nobody has used yet.
  `insertableItems()` (`examples/website-sandbox-widgets.js`) is the one flat list both
  the tree and quick-search read - built-ins and custom types together, each entry
  carrying the single `place` call that puts it on the canvas - so neither surface owns a
  copy of the catalogue. `insertCategories()` derives the second level from that same
  list, in first-appearance order, which is why a category cannot exist in the menu
  without an item in it.
  The creator's `onSaved` / `onDeleted` hook is renamed `syncCustomTypes()` ->
  `syncCatalog()` and now tears the whole tree out and rebuilds it, because a save may
  coin a category and a delete may empty one - so a new type is placeable the moment it
  is saved, with **no reload**, and an emptied category's trigger disappears with its
  last item rather than lingering as a caret onto nothing. `+ New Type...` is
  re-registered after the rebuild to stay last, since registration order is render order.
  *Migration*: none for library consumers. For anyone driving the Sandbox tab: an insert
  is now three clicks (`+ New`, a category, the item) rather than two, so a script that
  clicked `[data-menu-item="insert-button"]` straight off the root menu must open
  `insert-new` and `insert-cat-basic` first - or use Shift+A. An older custom type saved
  without a `category` reads back as `Custom`; nothing needs rewriting.

### Notes

- **The dirty-cache was audited, not rebuilt.** Offload depends on the existing
  invalidation machinery being correct, so that machinery was re-verified rather than
  extended: an idle canvas records nothing in `_frameDirty` and writes nothing into any
  content node; `invalidate('content')` reaches `_frameDirty`, which is what gates a
  connector redraw through `isGlobalDirty`; and a Pin invalidated twice in one frame
  renders once, because the dirty collections are Sets. Each claim is now a concrete
  assertion in `tests/unit/offload.test.js` rather than a prose belief. **Finding: already
  correct and load-bearing. No new dirty-cache machinery was added, and none was needed.**

- **Submenu placement clamps; it does not flip. Known, measured, and deferred.** A flyout
  is placed at its trigger's right edge and then pulled back inside the host box by the
  same clamp the root menu uses. Near the host's right edge that pull-back is the whole
  panel width, so the flyout lands **exactly on top of the panel that opened it**: the
  trigger is not merely covered but unhittable, and the one category label still visible
  behind an item panel is the *first* category rather than the open one, which reads as
  the wrong breadcrumb. Measured on a 1146px-wide host with 168px panels: a two-level
  chain overlaps from a click at ~x=987 rightward, a three-level chain from ~x=825 -
  roughly the right 29% of the canvas.
  The native-menu answer is to **flip**: place the flyout at `anchor.left - panelWidth`
  when `anchor.right + panelWidth` would overflow, and clamp only if neither side fits.
  That is a change to `placeInHost`'s contract - the root menu anchors at a point and
  should keep clamping, a flyout anchors to a box and should flip - so it is a real
  design decision rather than a tweak, and it is recorded here rather than made
  silently. The existing browser coverage asserts that every item in the *innermost*
  panel stays clickable, which holds; it does not assert that an ancestor trigger stays
  reachable, which is the part that does not.

## 0.4.0 (2026-09-03)

### Added

- **`pin.bordered` - the card's border, toggled on its own.** A Pin option
  (`bordered: false`) and a real get/set pair, finer-grained than `chrome` and
  independent of it: `chrome: false` takes the whole card away for a component that
  draws its own, while this leaves the surface, padding, radius and shadow exactly
  where they were and withholds only the border. The state is one class
  (`is-borderless`) on the root element, so it is writable at any time rather than a
  construction-time invariant like `utility` and `selectableText`.
  The stylesheet's half is `border-color: transparent`, **not** `border: none`:
  `box-sizing: border-box` only makes a *specified* width include its border, so
  removing the border shrinks a self-sizing card by 2px in each axis and moves the
  content box of an explicitly-sized one by the same amount. The toggle is a repaint
  and moves nothing, which a browser test asserts to the subpixel.
  *Migration*: none - `bordered` defaults to `true`, which is what every Pin already did.

- **`ResizableTrait` - pointer resizing from edge and corner handles.** Opt-in, and
  holding the trait *is* the toggle: `pin.addTrait('resizable', options)` grants it,
  `pin.removeTrait('resizable')` cancels any live gesture and takes every handle
  element back out of the DOM.
  Options: `directions` (any subset of `n s e w ne nw se sw`, all eight by default;
  an unknown one throws rather than being silently dropped), `minWidth`/`minHeight`
  (default 40 x 24), `maxWidth`/`maxHeight` (unbounded, and never resolved below the
  matching floor), `alwaysVisibleHandles` (default false - handles follow
  `pin.selected` through the `select` signal, which is the canvas-editor convention
  and keeps an idle canvas clean; a Pin built with `selectable: false` needs this
  option).
  Structurally the twin of `DraggableTrait`: the same `DRAG_THRESHOLD_PX` (imported,
  not restated), the same one-way gate, the same announce-at-the-threshold discipline
  so a click on a handle is silent, and the same missing-event cancellation
  convention. Deltas are projected through `screenToCanvas` at both ends, so a resize
  is correct at every zoom and survives a pan mid-gesture. A near-edge drag (`n`/`w`
  components) moves the origin to hold the far edge still, including while the box is
  clamped against its own minimum.
  Handles are direct children of the Pin's **root** element - not the content node,
  which display traits rebuild - and each carries `data-cc-control` (so the pointer
  router declines the deferred capture and `DraggableTrait` stands down) plus
  `data-cc-resize-handle="<direction>"`, identity-checked against the trait's own map
  so a child Pin's handle never resizes its parent.

- **Two new Pin signals, `resize:start` and `resize:end`**, added to
  `PIN_SIGNAL_TYPES` and therefore relayed by `PinSignalBus` like every other one.
  `resize:start` carries `{width, height, direction}` - the box the gesture is
  leaving from, mirroring `drag:start` - and `resize:end` carries
  `{width, height, cancelled}`, mirroring `drag:end`.
  *Migration*: a handler subscribed through `PinManager.onSignal` now sees two more
  event types; filter on `event.type` as the existing drag handlers already do.

- **`resizePin(pin, width, height)`** applies a new box programmatically: the DOM
  write, the particle write and the invalidation a resize owes the renderer, in one
  call. `pin.particle.setSize` alone has never resized anything on screen and still
  does not; this is the supported route.

- **`data-cc-bordered="true|false"`** is honoured by `hydrate()`: `bordered` joins
  the boolean-coerced option set, so authored markup cannot silently pass the
  *string* `"false"` (which is truthy) and be ignored.

- **Exported**: `ResizableTrait`, `resizePin`, `RESIZE_DIRECTIONS`, `RESIZE_HANDLE_ATTR`,
  `RESIZE_HANDLE_CLASS`, `MIN_RESIZE` from the package root, and the trait is
  registered as `'resizable'` in `TraitRegistry` so the registry name works from the
  built bundle. `CONTROL_ATTR` is now named in `src/pins/pin-element.js` rather than
  only spelled inside `CONTROL_SELECTOR`, because code that *writes* the attribute
  needs the same string the two layers reading it were built from.

- **A right-click menu of the canvas's own, and a registry to put commands on it.**
  `registerMenuItem({id, label, when, action, group})` / `unregisterMenuItem(id)`
  (plus the `MenuRegistry` class and its `menuRegistry` singleton) from the package
  root. `when(session, context) -> boolean` decides visibility per opening and
  `action(session, context)` runs on click, where `context` is `{pin, x, y}` and
  `pin` is null on bare canvas. Ids are unique - re-registering one throws rather
  than displacing a command something else registered - registration order is render
  order, and items sharing a `group` render together, separated from the next group
  by a rule. `menuRegistry.clear()` restores the built-ins, exactly as
  `TraitRegistry.clear()` does.
  Built in by default: `nav-back` ("Back"), `nav-forward` ("Forward"), and the
  Pin-scoped `bring-to-front` / `send-to-back`.
  The menu is one element in the session's overlay layer, built by `mount()` and
  removed by `destroy()`; every item is a real `<button>` inside `role="menu"`, so
  keyboard operation is the platform's. It closes on an outside `pointerdown`, on
  `Escape`, and on running a command - and hands focus back to the host on the way
  out.
  **The native menu is still a real outcome.** If no command's `when()` passes, the
  event is left completely alone and the platform's own menu opens as it always did;
  suppression is earned by having something better to show.
  *Migration*: none, unless a page relied on right-clicking a Pin doing nothing.

- **`bringToFront(pin)` / `sendToBack(pin)`** move a Pin's element among its
  siblings - paint order among equals *is* document order, so there is no z-index
  bookkeeping to keep in step. Send-to-back stops in front of the focus veil, which
  is the plane's deliberate first child. Elevation (`cc-elevated`, `cc-dragging`)
  is the orthogonal axis and still outranks both.

- **`session.goForward(options)` - Forward to `popFocus()`'s Back.** `popFocus()`
  now pushes the state it leaves onto a forward stack (`session._forwardStack`), and
  `goForward()` pops it back, sharing one `restoreState` with `popFocus` so the pair
  is symmetric rather than merely similar. Any *new* navigation - `focus`,
  `pushFocus`, `promoteToRoot`, `focusParent`, `unfocus` - invalidates the forward
  history, which is the standard browser rule and is enforced in exactly one place
  (`focusPin`, which every new navigation runs through and neither traversal does).
  `goForward()` with nothing ahead is a no-op rather than a reset: it announces
  nothing, publishes nothing, and moves nothing.
  *Migration*: none. `canGoBack(session)` / `canGoForward(session)` are exported from
  `src/engine/navigation.js` for chrome that needs to enable or disable its own
  buttons.

- **The new `.cloudcanvas-context-menu*` rules** in `CANVAS_DEFAULT_CSS`, reading
  `--cc-menu-bg`, `--cc-menu-border`, `--cc-menu-item-bg`, `--cc-menu-item-bg-hover`,
  `--cc-menu-min-width` and `--cc-z-menu` - each chaining through a card or button
  token to a foundation one, so a theme that restyles cards restyles the menu with
  them and nothing new has to be named.

- **A "Sandbox" tab on the product site: a working site builder** (`examples/`,
  six new files - `website-sandbox.js` plus `-chrome`, `-widgets`, `-inspector`,
  `-profiles` and `.css`). A palette of the sixteen `lib/` base widgets and a
  Container; click to place one at the middle of the view (cascaded so repeats
  never stack exactly) or drag it from the palette to a point, converted through
  `session.viewport.screenToCanvas`; a drop onto a Container nests it in that
  Pin's scope. Every placed widget is draggable, selectable and `resizable`. An
  Inspector shows for a single selection with two-way X / Y / Width / Height,
  a `bordered` checkbox, and one editor per content key - text, number, checkbox,
  or a JSON textarea for arrays and objects, which refuses invalid JSON rather
  than writing half a value to the canvas.
  Profiles auto-save to `localStorage` through `autoSaveSession`; the toolbar
  carries New, Save As, Load, Delete, Download as ZIP (`downloadStaticSite`) and a
  live save indicator. **Opening the tab restores the last profile with no click**,
  which is the feature the rest of it exists to serve. `restoreTree` brings the
  `resizable` trait, the border state and the card chrome back with it.
  The site shell barely moved - a `data-tab="sandbox"` button and panel in
  `website.html`, and the module's entry in `LAZY_TAB_MODULES` - because the tab
  claims itself through `registerTab('sandbox', mount)` exactly as Examples does.
  The one further shell change is the page's light theme: `setTheme` now applies
  `{...LIGHT_THEME, ...LIB_LIGHT_THEME}` rather than the core set alone, because
  the Sandbox is the first tab to render base-kit widgets and their nine tokens
  (`--cc-tone-*`, `--cc-input-*`, `--cc-track-bg`, `--cc-thumb-bg`) were otherwise
  left on their dark fallbacks in light mode. The two sets share no key, so this
  is purely additive and no other tab's rendering changes.
  Nothing in `src/` or `lib/` changed to make it work; the one capability it had
  to supply itself is **click-to-select**, which the core deliberately does not
  wire (see ARCHITECTURE.md §2.17).
  Covered by `tests/browser/website-sandbox.test.js`: fifteen checks against the
  real page in real chromium, including a page reload that must restore the exact
  layout untouched, and a Download as ZIP that must produce a file on disk an
  independent extractor can read.

### Changed

- **BREAKING (behaviour): `session.focus(pin)` now promotes.** Zooming into a Pin and
  making it the parent view were always the same gesture; having them be two calls
  (`focus` and `promoteToRoot`) meant the interesting one was the one nobody reached
  for. `focus(pinOrId, options)` defaults `options.promote` to `true`, so the
  targeted Pin becomes the render root - its subtree plus its full ancestor chain
  stay mounted, everything else demotes, and the breadcrumb is what leads back out.
  `pushFocus` and `promoteToRoot` are unchanged, and `popFocus()` still restores
  exactly what was left.
  The two internal call sites that are the *user's* "zoom into this pin" gesture went
  with the default: `FocussableTrait`'s click-to-focus and keyboard `Enter` on a
  roved-to Pin. Everything else that focuses (`focusParent`, the internal camera
  work) is unchanged and still camera-only.
  *Migration*: pass `{promote: false}` for the old camera-only behaviour -
  `session.focus(pin, {promote: false})` is exactly what `focus(pin)` used to do.
  For a Pin whose click should look without zooming in, `new FocussableTrait({
  focusOnClick: true, promote: false })`.

- **Re-focusing the Pin that is already the promoted root stacks nothing.**
  `promoteToRoot` now re-frames instead of pushing a second identical entry: with
  promotion as the default outcome of every click and every Enter, a duplicate is a
  Back that goes nowhere, and repeat activation is exactly how one arrives at it.

### Fixed

- **The example pages boot again.** `examples/app.js`, `website.js`,
  `website-showcase.js` and `gallery.js` still imported the component library
  (`createBreadcrumbPin`, the chat/calendar/flow factories, `injectComponentStyles`,
  the gallery's six) from `../src/index.js` after 0.3.0 moved that library to
  `lib/components/`, so every example page died at module evaluation with
  *"does not provide an export named ..."*. They import from
  `../lib/components/index.js` now, which is where the package's `./components`
  export points. The core surface is unchanged; only the examples were wrong.

### Notes

- **Why a resize writes the DOM as well as the particle.** The renderer never writes
  a Pin's box: its read phase *reads* `offsetWidth`/`offsetHeight` into the particle,
  so `particle.setSize` on its own changes nothing on screen and is overwritten by the
  next measurement. `resizePin` writes the element's inline size (with `max-width: none`,
  so the card's readable-measure clamp cannot cap a width the user just dragged out),
  writes the particle, then `invalidate('content')` - which queues
  the next read phase *and* puts the Pin in the frame's dirty set, so connectors
  anchored to its centre and the scope well it sits in both follow it.

## 0.3.0 (2026-09-04)

The syntax-refinement release: a correctness fix for DOM adoption, the adoption/
hydration API that fix unlocked, a concision pass across `Pin`'s public surface, two
small API merges, a documentation correction on `transmit()`, and prebuilt
distribution bundles. Every deprecated name keeps working - `Removed in 0.4.0`.

### Fixed

1. **A Pin built from `options.element` (adoption) is now interactive.** `setupElement`
   was only ever applying `cloudcanvas-pin` inside `createDefaultElement`, which never
   runs when a caller supplies their own element - so an adopted Pin's `DraggableTrait`/
   `SelectableTrait`/keyboard actions silently never fired, because the pointer and
   keyboard routers resolve every event through `.closest('.cloudcanvas-pin')`. The class
   is now applied unconditionally and additively in `setupElement` itself.
   *Migration*: none - this only makes previously-broken adoption work.

### Added

2. **`session.adopt(element, options)`** turns a real, pre-existing DOM element - hand-
   authored or server-rendered, children and all - into a live Pin with zero framework-
   side re-creation of its markup. Backed by a new `preserve` display type whose
   `build`/`update` are both true no-ops.
3. **`session.hydrate(container, selector = '[data-cc-pin]')`** walks a container for
   matching elements and adopts each one, inferring parent/child Pin relationships from
   DOM nesting and reading `data-cc-*` attributes as construction options (numeric keys
   throw on a non-numeric value rather than silently producing `NaN`; boolean keys accept
   only the literal strings `"true"`/`"false"`). A whole static page becomes a canvas with
   no `createPin` calls at all.
4. **`Pin` gains read-only `x`/`y`/`z`, `magnitude`, `gradient`, and `displayTrait`
   getters**, and real `get`/`set` pairs for `selected`, `dragging`, and `pinned`,
   matching the `lazy` accessor already on the class.
5. Prebuilt distribution bundles: `dist/cloudcanvas.esm.js` (+ `.min.js`) for
   `<script type="module">` over http(s), and `dist/cloudcanvas.iife.js` (+ `.min.js`)
   exposing `window.CloudCanvas` for the strict zero-server `file://` case - confirmed
   empirically that an ESM bundle, even at a single file, still fails under `file://`
   (Chromium's module loader requires a CORS-mode fetch regardless of file count), so
   only the IIFE build satisfies "open the HTML file with nothing running." Built by
   `npm run build` (esbuild, devDependency-only), a release-time step never required for
   framework development.

### Deprecated (removed in 0.4.0)

6. **Pure forwarding getters** now delegate to the collection they wrapped -
   `getContent`/`hasContent`/`getAllContents` (→ `pin.contents`), `getTrait`/`hasTrait`/
   `getTraits` (→ `pin.traits`), `getChildren` (→ `pin.children`), `getVectors`/
   `getVector`/`getPrimaryVector`/`getMagnitude`/`getGradient` (→ `pin.particle`, or the
   new `pin.magnitude`/`pin.gradient` getters). *Migration*: read the Map/Set/particle
   directly, or use the new getter.
7. **`setSelected`/`setDragging`/`setPinned`** → assign `pin.selected`/`pin.dragging`/
   `pin.pinned` instead.
8. **`getType`/`setType`** → `getDisplayTrait`/`setDisplayTrait` (the old names return/
   accept a trait instance, not a string, which the old names actively misled about).
9. **`Viewport#focusOn`** → `Viewport#zoomToFit` (identical math, one call site); the
   canonical name now throws `TypeError` on a box that describes nothing instead of
   silently framing the origin.
10. **`session.resetView()`** → `session.unfocus()` (undifferentiated one-line alias).

### Documentation

11. **`ARCHITECTURE.md`'s `transmit()` section was wrong** about what it dispatches on -
    corrected to state precisely that `transmit()` dispatches on the **Pin instance**
    (not `.element`), walking the Pin's `.parent` graph, which is why it survives
    detachment and reaches elementless utility Pins. For an ordinary, always-mounted UI
    subtree, native `pin.element.dispatchEvent(new CustomEvent(type, {bubbles:true}))` +
    `parentPin.element.addEventListener(...)` already works today via real DOM nesting
    and is now documented as the default reach, with `transmit()` reserved for what
    native bubbling structurally cannot do.
12. `src/index.js`'s 126 exports are now grouped into three banked comment sections -
    start here, everyday, advanced/custom-host-authors - with `createCanvasSession`/
    `Pin`/`PinEvent` moved to the top of the file.

### Packaging

13. **The pre-built pin-board component library moved from `src/components/` to
    `lib/components/`**, and the core barrel (`src/index.js`) no longer re-exports it -
    neither the flat 25-name list nor the `components` namespace object. Two defects
    this closes: the top-level `traitRegistry.registerDefaults(registerComponentTraits)`
    call that ran the moment anyone imported `cloudcanvas` (registering 12 component
    traits into the shared registry as a side effect of importing the *core*) is gone -
    registration is explicit-only now, same discipline as `lib/index.js`'s base kit -
    and every file that library imported through deep paths into `src/pins/traits/*` and
    `src/graphics/primitives/primitives.js` now goes through the public API only.
    Measured effect: a core-only bundle (`npm run build`) dropped from 67 modules /
    310 KiB to 54 modules / 240 KiB (unminified).
    *Migration*: the public import specifier is unchanged - `cloudcanvas/components`
    still resolves, now to `lib/components/index.js`. Only a consumer importing the
    internal path `cloudcanvas/src/components/...` directly (never a supported path)
    needs to update it. `lib/` also gained its own package export (`cloudcanvas/lib`)
    and joined the published `files` whitelist - it shipped on disk since 0.2.0 but was
    never actually publishable.

## 0.2.0 (2026-09-02)

The conjugate-render release. The frame loop, the trait registry, the event system,
and the reload lifecycle all changed shape, and the interaction, accessibility and
design layers arrived on top of them. Every numbered item below carries its
migration path; where it reads *Migration: none*, the change is additive.

### Rendering & contents

1. **Content keys render as text; markup requires the explicit `html` key.**
   Display templates build their subtree once and thereafter write through `Text.data`
   and attributes, so `title`, `body`, `author`, `caption`, and `label` values are
   escaped by the DOM and can no longer inject markup.
   *Migration*: a Pin that genuinely needs markup sets the `html` content key (supported
   by `raw`, and by `card` as a per-Pin override that replaces the whole card template).

2. **A custom `render` receives the Pin's content element and runs only on content changes.**
   `DisplayTrait({ render })` is called as `render(pin, contents, contentElement, context)`
   with `.cloudcanvas-pin-content` - never the Pin's root element and never its scope
   container, so no display implementation can detach mounted child Pins. It runs from the
   renderer's write phase for Pins marked content-dirty, not once per frame.
   *Migration*: renderers that wrote into `pin.element` write into the supplied element
   instead. A renderer that must keep the build-once contract can pass a
   `{ build, update }` template pair instead, which outranks `render`.

3. **The trait registry is definition-based; trait instances are per-Pin.**
   `TraitRegistry` stores `{ name, ctor, defaults }` definitions and never instances.
   - `register(name, ctor, defaults)` - **throws** on a duplicate name (silently replacing
     a definition other code depends on was the old behaviour) and on a non-function ctor
     or empty name. `unregister(name)`, `has(name)`, `get(name)`, `list()` and `clear()`
     (which restores the built-in set) complete the surface.
   - `create(name, options)` returns a **fresh instance every call**, shallow-merging caller
     options over the registered defaults; `capabilities` is the one additive key, so a
     caller extends the capability set instead of erasing it.
   - The registry holds definitions only. The live instance index is
     `PinManager.traitIndex` / `capabilityIndex`.
   *Migration*: code that reached into the registry for a shared trait instance now looks
   up `manager.getPinsByTrait(name)` / `getPinsByCapability(cap)`; two Pins declaring the
   same trait name no longer share connections, selection, or drag state.

4. **`PinEvent` no longer assigns `target`; the origin is `detail.source`.**
   `PinEvent extends CustomEvent`, so the DOM owns `target` during dispatch. The `target`
   constructor option is accepted only as a legacy alias for `source`.
   *Migration*: read `event.detail.source` (or `event.payload` for the value). `cancelled`
   remains as an alias for `defaultPrevented`.

5. **`pin.lazy` is a derived getter over `reload`.**
   `lazy` reads `reload === 'lazy'`; assigning it sets `reload` to `'lazy'` or `'active'`.
   Reload state is otherwise the single flag, and an unknown strategy string **throws**
   rather than silently downgrading a Pin's lifecycle.
   *Migration*: declare `reload: 'active' | 'persistent' | 'lazy'`; `lazy: true` still works
   as the construction alias.

6. **Removed: `typeRegistry`, `VectorPointerTrait`, `ScopeTrait.title`.**
   *Migration*: `typeRegistry` -> `traitRegistry`; `VectorPointerTrait` -> the
   `vector-pointer` display type (`type: 'vector-pointer'`, or
   `new DisplayTrait({ displayType: 'vector-pointer' })`); a scope caption is ordinary
   contents on the scope Pin.

### API surface

7. **`Pin.addTrait` throws instead of failing quietly.**
   An unregistered trait name, a non-string/non-`PinTrait` argument, a name/instance
   mismatch, and a second trait of a name the Pin already carries all throw. A trait whose
   `onAttach` throws is rolled back, never left half-registered.
   *Migration*: use `replaceTrait(nameOrTrait, options)` to swap a trait, and `setType()`
   for the display trait (atomic: the previous display traits are restored if the swap fails).

8. **`Pin.setContents` throws when the display trait's `allowedKeys` rejects a key.**
   The merge is rolled back first, so a Pin is never left half-updated.
   *Migration*: declare `allowedKeys` deliberately (it is `null` - unconstrained - by
   default), or catch the error at the call site.

9. **`ParticleEngine` takes no constructor options.**
   `new ParticleEngine(options)` silently ignored everything passed to it; the constructor
   now declares its own state only.
   *Migration*: configure motion per particle (`friction`, `mass`, `pinned`) and per session
   via `addForceField(fn)`.

10. **Session focus framing defaults come from the target's `FocussableTrait`.**
    `focus()` / `pushFocus()` read `padding` and `maxZoom` off the focused Pin's own trait;
    caller options still win.
    *Migration*: move per-target framing onto the trait
    (`new FocussableTrait({ padding, maxZoom })`) instead of repeating it at every call site.
    `FocussableTrait` is now framing only: `cursorColor`, `label` and `showFrustum` are no
    longer read, because the reticle is the session's `cursor-focus` cursor rather than a
    per-Pin drawing. Reskin the cursor definition once instead of configuring every Pin.

11. **The default export is gone from `src/index.js`; named exports only.**
    A hand-maintained aggregate object drifts every time a symbol is added.
    *Migration*: `import { createCanvasSession, Pin } from 'cloudcanvas'`, or
    `import * as CloudCanvas from 'cloudcanvas'` for a namespace object.

### Graphics primitives

12. **Colors and URLs crossing the markup boundary are validated, not just escaped.**
    `safeColor()` accepts only hex, `rgb()/rgba()/hsl()/hsla()`, bare keywords, and
    `var(--name[, fallback])` (the fallback is validated in turn); anything else degrades to
    the fallback color. `safeUrl()` passes relative and `http(s)` URLs and `data:image/*`,
    rejecting `javascript:` and `data:text/html`. `safeNumber()` keeps `NaN`/`Infinity` out
    of paths and attributes.
    *Migration*: a badge, stroke, or connector color that was previously an arbitrary string
    (`#fff;"><img onerror=...>`, or any CSS expression outside the grammar) now renders as
    the fallback instead of as markup.

13. **`createGradientMeterSVG` renders 0% when `min === max`.**
    The degenerate span previously divided by zero and produced `NaN%` in the inline width.
    *Migration*: none; a zero-width span is now a defined, empty meter.

### Design system

14. **Every template class is namespaced: `pin-*` is now `cloudcanvas-pin-*`.**
    The 13 class names the built-in display templates emit are declared once, in the
    exported `CLS` table (`import { CLS } from 'cloudcanvas'`), and matched by
    `CANVAS_DEFAULT_CSS`. Full map: `pin-header` -> `cloudcanvas-pin-header`,
    `pin-title` -> `cloudcanvas-pin-title`, `pin-badge-slot` -> `cloudcanvas-pin-badge-slot`,
    `pin-body` -> `cloudcanvas-pin-body`, `pin-footer` -> `cloudcanvas-pin-footer`,
    `pin-author` -> `cloudcanvas-pin-author`, `pin-action-btn` -> `cloudcanvas-pin-action-btn`,
    `pin-needle-slot` -> `cloudcanvas-pin-needle-slot`, `pin-gauge` -> `cloudcanvas-pin-gauge`,
    `pin-label` -> `cloudcanvas-pin-label`, `pin-meter-slot` -> `cloudcanvas-pin-meter-slot`,
    `pin-media` -> `cloudcanvas-pin-media`, `pin-caption` -> `cloudcanvas-pin-caption`.
    The vector-pointer body additionally carries `cloudcanvas-pin-gauge-row`.
    *Migration*: rename the selectors in any host stylesheet, or delete them - the
    framework now ships a complete default look for all of them.

15. **Templates emit no inline styles; the default stylesheet is fully tokenized.**
    Layout and color that used to live in `style` attributes on the gauge, label, media
    and caption nodes are class rules in `CANVAS_DEFAULT_CSS`, so a host rule can
    override them without `!important`. Every themable value in that sheet is a
    `var(--cc-*, <dark default>)` read: the dark theme *is* the fallback chain.
    *Migration*: a host rule that previously lost to an inline style now wins. Retint
    with tokens (`--cc-card-bg`, `--cc-btn-*`, `--cc-text-muted`, ...) rather than
    restating rules.

16. **`applyTheme(host, vars)` and `LIGHT_THEME`; `injectSessionStyles(css)` splits off
    the base sheet.** `applyTheme` writes `--cc-*` custom properties onto a host element
    (a `null` value removes one token, a `null` map clears them all); `LIGHT_THEME` is the
    frozen reference override set. `injectCanvasStyles()` is now write-once: it never
    rewrites a base `<style>` the document already has, and its `customCSS` argument is
    deprecated in favour of `injectSessionStyles(css)`, which returns a removable
    `<style data-cc-session>` element.
    *Migration*: `injectCanvasStyles(css)` still works and still injects, but the CSS now
    lands in its own element; take the return value of `injectSessionStyles` and remove it
    on teardown.

### Interaction

17. **The wheel scrolls the canvas; it no longer always zooms.**
    A `wheel` event is normalized to pixels of intent (`deltaMode` 0/1/2 x 1/16/host
    height) and clamped to +/-160px per event, then routed three ways: `ctrl`/`meta`
    is a trackpad pinch and zooms about the pointer (`exp(-d * 0.01)`); an unmodified
    event that looks like a discrete notch (non-pixel `deltaMode`, or vertical-only,
    integral, and >= 40px) zooms about the pointer at ~1.2x per notch
    (`exp(-d * 0.0015)`, exactly reversible); **everything else pans the camera**,
    on both axes, against the gesture. A purely horizontal event never zooms, and
    `deltaY === 0` never zooms. The maths is pure and exported from
    `src/engine/wheel.js` (re-exported by `pointer.js`); every constant is tunable.
    *Migration*: a page that relied on "any wheel = zoom" now gets a two-axis pan
    from a trackpad. Zoom programmatically (`viewport.zoomAt`) or bind your own
    handler if you need the old behaviour.

18. **Gestures require the primary pointer's main button, and touch pinches.**
    A gesture starts only on `isPrimary && button === 0` - a right or middle button
    no longer pans - with one deliberate exception: the second finger of a touch
    pinch, admitted only while exactly one gesture pointer is already down. Two live
    pointers cancel any drag or pan and become a pinch (zoom by the separation ratio
    about the *previous* midpoint, plus midpoint translation); lifting back to one
    finger resumes the pan with no jump. `contextmenu` is suppressed **only**
    mid-gesture; idle, the native menu opens as the platform intended.
    *Migration*: none, unless you drove the canvas with a non-primary button.
    Removed dead session fields: `activePointer`, `touchPinchDist`, `dragOffset`.

19. **A pointer gesture that starts on a control is not captured.**
    `setPointerCapture` retargets the rest of the stream - including the `click`
    computed from it - so capturing on the host made every `<button>`, `<a>`,
    `<input>`, `<select>`, `<textarea>`, `<label>` and `contenteditable` inside a Pin
    unclickable. Capture is now declined for those, and for a press inside selectable
    text. The window listeners deliver the gesture either way.
    *Migration*: none. Interactive content inside a Pin now works.

20. **`selectableText: true` makes a Pin's text selectable.**
    The Pin's element gains `is-selectable-text`, the content node gets
    `user-select: text` and a text cursor, and a `pointerdown` inside it is flagged
    (`_ccTextRegion`) so `DraggableTrait` stands down and the press places a caret.
    The **header row stays the drag handle** - `.cloudcanvas-pin-header` keeps
    `user-select: none` and `cursor: grab` - as does the card's own padding, so the
    Pin is still movable. Nested child Pins are unaffected: they are reached through
    the scope container, never the parent's content node.
    *Migration*: opt in per Pin (`createPin({ selectableText: true })`).

### Accessibility

21. **The canvas is fully keyboard-drivable (`src/engine/keyboard.js`).**
    The host is a *single* tab stop (`tabindex="0"`, never overwriting an author's),
    and Pins are roving targets (`tabindex="-1"`), so Tab never walks through
    hundreds of cards. Host-focused: arrows pan 40px (x4 with Shift), `+`/`=` and
    `-`/`_` zoom 1.2x about the host centre, `0` resets, `Enter` drops into the Pins,
    `Escape` pops focus, `Home` unfocuses. Pin-focused: arrows rove **reading order**
    (top-to-bottom then left-to-right over participating, awake Pins), `Enter`
    focuses the Pin, `Escape` returns to the host. Handled keys are defaulted away
    and nothing is taken from an editable target or a native control. The table is
    exported as `KEY_BINDINGS`; `ensureVisible(session, pin)` and `readingOrder(session)`
    are exported beside it.
    *Migration*: none, but `role="application"` (below) ships *because* these keys do.

22. **ARIA identity, and a live region for everything transient.**
    The host takes `role="application"`, `aria-roledescription="canvas"` and an
    `aria-label` (`options.label`, default "Interactive canvas"); Pins take
    `role="group"`, `aria-roledescription="pin"` and an `aria-label` funnelled from
    their `title` content on every render (change-gated, so an idle frame still
    writes nothing). The SVG and cursor layers are `aria-hidden="true"`. One polite
    `role="status"` region (`.cloudcanvas-live-region`) announces focus changes
    ("Focused X" / "Focus cleared"), provider results ("N items loaded") and provider
    failures. **Author values are never overwritten**, on any of these attributes.
    *Migration*: a host that already declared a role or label keeps both.

23. **Reduced motion is honoured by construction.**
    `prefersReducedMotion()` (exported from `viewport.js`) caches one `matchMedia`
    query and tracks changes; when it matches, `animateTo` jumps to the target and
    fires `onComplete` synchronously, so every camera path - `focus`, `pushFocus`,
    `popFocus`, `resetView`, `ensureVisible` - collapses at one choke point. The CSS
    half is a `@media (prefers-reduced-motion: reduce)` block over pins, the focus
    veil and the SVG slots' inline transitions.
    *Migration*: none.

24. **Badge text contrast is computed, and a theme can take the decision back.**
    For a six-digit hex tint, `createBadgeSVG` composites the fill over the assumed
    card surface and picks whichever default foreground clears 4.5:1 (asserted for the
    whole tint sweep). That colour has to be inline, so it is emitted as the
    *fallback* of a token read - `color: var(--cc-badge-text-override, <computed>)` -
    because an inline declaration outranks any host-level token and a theme that
    merely redefined `--cc-badge-text` was silently losing (light-theme badges measured
    ~1.15:1). `LIGHT_THEME` now sets `--cc-badge-text-override`, which is an explicit
    theme choice: one colour cannot be the best foreground for every tint, but on a
    light card the whole range wants dark text. The assumed surface is a parameter
    (`createBadgeSVG(label, color, { surface })`), and `relativeLuminance` /
    `contrastTextFor` / `compositeOver` are exported from the package root.
    *Migration*: a theme that retinted badge text through `--cc-badge-text` should
    set `--cc-badge-text-override` as well; the old token still styles hand-authored
    badge markup.

### Layout & layering

25. **A scope well is a state the renderer grants, not the default.**
    Every Pin owns a `.cloudcanvas-pin-scope` container, so an empty one now costs
    nothing at all: `display: none`, no border, no gap. The box, dashed outline,
    gap and clipping arrive with `cc-populated`, written only when a live child is
    actually inside, together with a `min-height` measured from the children's own
    offsets. **A populated well clips** (`overflow: var(--cc-scope-overflow, hidden)`),
    so a child can no longer spill over its parent's siblings.
    *Migration*: a Pin whose children were deliberately overflowing sets
    `--cc-scope-overflow: visible`. Authored heights on scope Pins should be dropped -
    the well measures itself.

26. **Focus elevation is a chain, and it dims what it is not.**
    Raising one element cannot lift it out of an ancestor's stacking context, so
    focusing (or dragging) a Pin walks the parent chain and marks every scope above it
    (`cc-elevated` / `cc-dragging`, `--cc-z-elevated` / `--cc-z-drag`). A focus also
    raises `.cloudcanvas-focus-veil` - a plane-level dimmer, on by default, disabled
    with `--cc-focus-veil: transparent`.
    *Migration*: pages relying on the old flat z-order may need to restate their own
    layering through the `--cc-z-*` tokens.

27. **`session.place({ width, height, near, anchor, margin })` picks a free spot.**
    A deterministic ring search out from the viewport centre (or an anchor, or a
    near-Pin's centre) that returns the first canvas top-left where the padded box
    hits no existing Pin. Exported as `place` too.
    *Migration*: replace random scatter (`Math.random() * 800`) at spawn sites.

28. **Global SVG groups only redraw for the camera if they ask to.**
    The SVG layer carries the same transform as the plane, so a canvas-space trait's
    geometry survives a pan or a zoom untouched. A group is now rewritten on a camera
    move only when its trait declares `screenSpace = true`; every built-in trait draws
    in canvas space and is skipped, which takes a full rebuild of every connector out
    of every frame of every camera animation.
    *Migration*: a custom `global-render` trait that projects to screen space itself
    must set `screenSpace = true` on its instances.

### Also in this release (non-breaking)

- `ConjugateRenderer`: one three-phase frame (structure -> batched reads -> writes), a
  three-float position diff instead of per-frame transform writes, and content work only
  for Pins marked dirty.
- Reload strategies (`active` / `persistent` / `lazy`) with a `loadChildren` provider that
  is single-flight, run-once, removal-race-safe, and re-armed by `unload()`; a rejected
  provider transmits a bubbling `childrenerror` event.
- Root promotion (`promoteToRoot`, `pushFocus(pin, { promote: true })`) with live
  breadcrumbs (`pin.breadcrumb()`, `session.breadcrumb()`) and full restore on `popFocus()`.
- Persistent per-trait `<g data-trait>` SVG groups: an idle frame performs zero `innerHTML`
  assignments.
- Frame-rate independent simulation: `dt` derives from the rAF timestamp and damping is
  `friction ** dt`.
- Null-pin cursors: one utility Pin (`__cursor__`) carrying `cursor-focus`, `cursor-selected`
  and `cursor-activated`, each tracking an independent target and drawing into a persistent
  `<g data-cursor>` in the overlay. Utility Pins are filtered out of every caller-facing
  query (`getAllPins`, root/active lists, spatial queries). Cursors are registry definitions:
  re-register one and call `session.remountCursors()` to reskin a live session, targets and
  all. A cursor draws only on a visible target - awake, mounted, and inside the promoted
  render root - and hides without forgetting the Pin, so it returns when the Pin does.
- Pin lifecycle signals (`activate`, `deactivate`, `select`, `destroy`) re-broadcast by
  `PinManager.onSignal(handler)`, giving the session one subscription point for state that
  changes inside a Pin.
- Trait-level dirty signalling for the SVG group layer: a `global-render` trait that mutates
  its own state bumps `this.revision`, and the group redraws on the next frame without
  waiting for anything to move. `ConnectableTrait.connectTo` / `disconnectFrom` do so.
- `pin.transmit()` accepts native `Event`/`CustomEvent` instances (wrapped, never mutated)
  and dispatches natively, so plain `addEventListener` subscribers receive Pin events.
- `npm run test:browser`: a Playwright smoke suite under `tests/browser/`, separate from
  the headless `npm test` unit and integration suites. `tests/browser/fixtures/bare.html`
  is a page with no CSS of its own, so the framework's default look is asserted from
  computed styles rather than eyeballed.
- Accessibility and interaction CSS: a `:focus-visible` ring on host and pins, a pin
  hover lift, 28px action buttons that grow to 44px under `@media (pointer: coarse)`,
  the `.cloudcanvas-live-region` visually-hidden class, and the `is-selectable-text`
  rules. The stylesheet itself moved to `src/graphics/styles-css.js` - it is data, not
  code - and is re-exported unchanged from `styles.js`.
- Connector strokes default to `var(--cc-connector, rgba(56, 189, 248, 0.6))`, so a theme
  retints the graph edges without touching any `ConnectableTrait`.
- The focus reticle was redesigned: corner brackets around the target rather than a
  dashed box, and the frustum spikes now reach from the focused Pin's **parent scope**
  corners - the real box of the scope it lives in - instead of the whole viewport,
  which is what every reticle used to claim as its parent. A Pin at the canvas root
  has no parent scope and so draws no frustum at all.
- `cc-moving`: `will-change: transform` is granted while a Pin is actually in motion
  and swept ~30 frames after it stops, so a canvas of stationary Pins costs no layers.
- `npm run test:browser` now runs two suites: `smoke.test.js` (the canvas end to end)
  and `acceptance.test.js` (the UI review's own probes - pinch through CDP, reduced
  motion, the parent-scope frustum, nine non-overlapping spawns, real text selection,
  badge contrast under both themes, and the reticle caption's contrast on the bare page).
- **The focus reticle's caption has its own colour token, `--cc-cursor-label`.** The
  stroke is a marker read as a shape; the caption is text with a WCAG floor, and the
  focus red it used to inherit measured **2.29:1** on the default canvas. The caption
  now paints `var(--cc-cursor-label, var(--cc-text, #e2e8f0))`, so it is the canvas's
  own body colour by default and a theme that moves `--cc-text` carries it along;
  `LIGHT_THEME` states `#1e293b` explicitly. Measured on the zero-CSS fixture: 15.31:1
  dark, 13.41:1 light. `CursorFocusTrait` takes `labelColor`, and
  `createFocusCursorSVG(bounds, { labelColor })` is the primitive-level knob; the
  caption element carries `.cloudcanvas-focus-cursor-label`.
  *Migration*: none. A reskin that wanted the caption in the reticle colour passes
  `labelColor` explicitly.
- **`destroy()` hands the host element back as it was found.** The session used to
  leave the `cloudcanvas-host` class, `role`, `aria-roledescription`, `aria-label` and
  `tabindex` on a host it no longer occupied. Each is now *recorded when written* and
  reversed only if this session was the one that added it - the mount path's
  author-values-win rule, read from the other end - so a page that had already labelled
  or classed its own canvas keeps every value through a full mount/destroy cycle, and a
  bare `<div>` comes back with zero attributes and zero children.
  *Migration*: none, unless you relied on the residue to style a torn-down host.
- **A press on a control inside a Pin no longer starts a drag, and a click wobble no
  longer moves the card.** `DraggableTrait` stands down for the same control list the
  pointer router already declines to capture for (`button`, `a[href]`, `input`,
  `select`, `textarea`, `label`, `contenteditable` - one exported `CONTROL_SELECTOR` in
  `src/pins/pin-element.js`, read by both layers), and translation begins only after
  the pointer has travelled more than `DRAG_THRESHOLD_PX` (3px, deliberately under
  `FocussableTrait`'s 5px click-travel guard so the two agree about what a click is).
  The drag offset is still measured at the press, so a real drag is exact - the travel
  spent crossing the threshold is carried, not swallowed.
  *Migration*: none. A gesture that must move a Pin from a button has to drag its chrome.
- The focus veil is `aria-hidden="true"`, alongside the SVG layer and the cursor overlay:
  it is a dimming surface with no content of its own. `.cloudcanvas-pin-author` states
  `line-height: 1.45` - the sheet's body ratio - instead of inheriting whatever the host
  page declared and moving the footer row's height with it.
- **`options.displayTrait` is the sanctioned custom-display path**, and
  `injectSessionStyles` is removable rather than host-scoped. Both are documented in
  ARCHITECTURE (§2.2 and §2.13): a display trait passed through `traits: [...]` throws,
  because the default has already claimed the name `display` and a Pin holds at most one
  trait per name; and a session stylesheet's rules are global for as long as the element
  is in the document, so consumers scope their own selectors under a host they control.

## 0.1.0

Initial release: Pin model, trait system, particle engine, viewport, and the example harness.
