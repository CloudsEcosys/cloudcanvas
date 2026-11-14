<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

# CloudCanvas architecture

Three repositories, each depending only on the ones before it:

| Repository | Package face | What it is |
|---|---|---|
| `cloudcanvas` (this one) | `cloudcanvas`, `cloudcanvas/<entry>` | The engine core: the core (`core/`), the add-on kernel (`kernel.js`), theme, tokens and primitives (`graphics/`), the logger (`log.js`). |
| `cloudcanvas-lib` | `cloudcanvas-lib`, `cloudcanvas-lib/<add-on>`, `ui`, `forms`, `display`, `components`, `archetypes`, `sandbox`, `defaults`, `graphics` | The add-ons (`plugins/`, their CSS in `plugins/css/`), the UI kit (`ui/`) and the library: the widget kit, the board components, page archetypes, and the board with its save format and static export. It reaches the core only through published entries (a unit test holds that boundary). |
| `cloudcanvas-site` | none (not published) | The site builder: one app on one board. |

## The core

Eleven small files, about 1,450 lines, 7.8 KB gzipped. Nothing in it registers anything on import.

**State** (`state.js`). One record per element in a module `WeakMap`: local placement `x y z`, a declared
size `w h` (null: the element sizes itself), the measured size, the scope offset, the running traits, the
port, and - on a root's host - the root. The handle is cached on the record, so `blit(el) === blit(el)`, and
the browser owns every lifetime: nothing is ever unregistered.

**Hierarchy is the DOM.** A blit's parent is the nearest `[data-blit]` above it; its children are the
`[data-blit]` elements whose nearest blit ancestor it is. A blit whose element must leave the document while it
stays in the tree (the offload add-on) is *parked* behind a Comment anchor, which ancestry walks read through.
A type that declares a `[data-scope]` element receives its children there.

**Roots** (`root.js`). `blit(host)` on an element under no root mounts one: a plane (the camera transform, every
blit) and a screen-space overlay, the camera, the frame loop, and an index of blits by id (parked ones
included). A root renders one branch as its world: `app.root = b` promotes `b`, hiding (`hidden`) the top of
every branch off its chain; removing the view root hands the view back to the host.

**The frame** (`frame.js`). One `requestAnimationFrame` loop per root, three phases in order - `structure`,
`read`, `write` - each a set of passes. The root's own passes measure what changed (read) and paint what is
dirty through each blit's port, then write the plane transform when the camera moved (write). Add-ons join with
`b.tick(fn, 'read' | 'write')`. Only dirty blits are touched, and a root with nothing dirty, no running pass
and no busy predicate stops requesting frames: an idle board costs nothing.

**Ports** (`port.js`). A port paints a blit. The default writes `translate3d(x, y, z)` and the declared size,
each only when it moved against the last write (five floats), so a still blit costs no DOM write and no
string. Any function `(b, ctx) => void` can replace it.

**Camera** (`camera.js`). Pan and zoom, and optionally 3D: `perspective`, `rotateX` and `rotateY` with CSS's own
definitions, the tilt about the host's centre. A flat camera writes `translate3d(...) scale(...)` on the plane;
a 3D one writes `matrix3d(view())` there and the perspective on the host (a flat one leaves the host's own alone),
and a host resize re-reads the box the tilt is centred on. `project` and `unproject` map canvas points to host
pixels and back through the same matrices, so pointer input keeps landing on the canvas plane.

**Spec** (`spec.js`). The one conversion between `data-*` attributes and the plain object a blit is described
by. Placement is numeric and a bad number throws; trait options decode from JSON with prototype keys dropped
and bad JSON warned about, never thrown.

**Types** (`type.js`). A `<template data-type>`, cloned into every instance. `fill` writes text into
`[data-slot]`s; only a slot the template marks `data-slot-html` takes markup. A name is never silently
replaced.

**Traits** (`use.js`). `blit.use({name: fn})` names a trait (or a port). A blit runs the traits its type
declares (`with`), its own anonymous ones (`with: [fn]`), and every named one it carries as a key, from the
moment it is indexed in a root; `set({name: false})`, removal and parking stop them, each through the cleanup
its trait returned. A late `use()` upgrades elements already carrying the name.

## The add-on contract

An add-on is a module under `cloudcanvas-lib/plugins/` exporting functions; one subpath each; pure on import.

- **A trait** is `(b, options, root) => cleanup`. `trait.js`'s `defineTrait` builds pointer-driven ones from a
  behaviour record (`init`, `press`, `move`, `release`, `mount`), wiring the press on the blit and the rest on
  the window, and stopping everything in the cleanup.
- **A root add-on** is a trait on the root's host (`pan`, `keyboard`, `menu`, `announce`, `cursors`, `history`,
  `reactions`), or a function over the root handle (`motion`).
- **A layer** is a root of its own that an add-on mounts over a host: `panels(host)` (`cloudcanvas-lib/panel`) gives a
  positioned host a `[data-cc-panels]` root whose blits are panels, so a board's camera underneath never moves them.
  A panel in a window of its own is parked (`park.js`) with its traits running, so its blit stays in the tree.
  The window module loads by `import()` only, like the GPU backends.
- **Frame work** goes through `b.tick` or `root.hooks`; reads in `read`, writes in `write`, never interleaved.
- **CSS** ships as a chunk under `cloudcanvas-lib/plugins/css/`, injected once by the add-on that owns it (`injectAddonCss`);
  every colour and metric is a `--cc-*` token.
- **Announcements** are `b.emit(type, payload)`: native, bubbling, cancelable, so the host hears everything.

| Event | From |
|---|---|
| `drag:start`, `drag:end` `{x, y, cancelled}` | drag |
| `resize:start`, `resize:end` `{width, height, cancelled}` | resize |
| `select` (payload: selected) | select |
| `focus:change` (payload: focused) | focus |
| `edit` (payload: open) | edit |
| `action` `{key}` | keyboard (Enter / Space on a blit) |
| `view:change` `{root, camera, back, forward}` | history |
| `children:load`, `children:error` | lazy |
| `dismiss` (cancelable) | a widget asking to go; a panel before its close control or Escape closes it |
| `panel:change` `{at, pinned, collapsed, open, active, from, window}` | panel, once a task's writes have settled |
| `panel:refused` `{at, reason}` | panel (a window that could not be opened; the place does not change) |
| `panels:inset` `{top, right, bottom, left}` | panel, on the layer's host, after it wrote the inset variables |
| `remove` | the core, before a blit leaves |

## GPU and 3D

`gpu(app)` (`cloudcanvas-lib/gpu`) draws blits on the GPU from one scene. A blit opts in with the named port `gpu`,
which still places its element - kept in the DOM at `opacity: 0` as the hit proxy, so events, hit-testing,
keyboard roving and the accessibility tree are unchanged - and queues the blit's record (global box, `z`, its
tint or its `gpuContent`). The scene (`gpu-scene.js`) packs records into one instance array in draw order (`z`,
then first seen), one batch per texture, and reports the smallest range that changed. One write pass after the
plane's hands that to the backend, only on frames where something drawn changed or the camera moved; a sweep
drops blits that left the port, the root or the view, and re-reads nested and self-sized ones.

Two backends meet one contract (written down in `gpu-scene.js`): WebGPU (WGSL) and WebGL2 (GLSL 300 es),
hand-written, instanced unit quads, straight-alpha textures written premultiplied. They load by `import()`
only, so neither is in a static chunk; `auto` tries WebGPU, then WebGL2, each on a fresh canvas. The canvas sits
under the plane (`layer: 'over'` puts it above). The GPU draws through `clipMatrix(camera)` -
`camera.projected()` mapped to clip space - so a DOM blit and a GPU blit at the same place land on the same
pixels, flat or tilted. `orbit` (`cloudcanvas-lib/orbit`) turns the camera with Alt + drag and moves the viewer with
Alt + wheel, in the capture phase, so no other add-on sees those presses.

A blit's content (`gpuContent`) is one part or a list: a quad (tint, texture, uv rect, rotation) or a mesh
(geometry, colour, lit), fitted as a unit shape to the box and a depth or mapped from a viewBox. Each part is a
scene record; meshes join the same z-ordered batch list as their own batches, depth-tested only against each
other. Textures and geometries are counted across records, so a sheet or a shape shared by a thousand blits is
one upload, and one let go and taken back within a frame is never re-sent. The content add-ons sit on this:
`sprites` (a sheet is a texture, a frame a uv rect, one ticker per root for animations), `text` (Canvas2D raster
per zoom bucket), `video` (re-sent per video frame), `own-canvas`, `mesh`, and `svg-path` (path data to fill and
stroke triangles). `xml` builds blits from an XML document by type, reading and checking all of it first.

Compositing: the plane's CSS 3D and the GPU draw through one camera, so a DOM blit and a gpu blit at the same
`z` land together under any tilt. With the canvas `over` the plane, a `punch` blit (a DOM blit) becomes an
erasing quad at its box and `z` - blended ZERO, ONE_MINUS_SRC_ALPHA - so the DOM under the canvas shows through
exactly there. `html-canvas` moves a blit's content into a `<canvas layoutsubtree>`, captures it on each
`paint` into a texture canvas and clears its own bitmap, so the HTML is shown once, by the GPU; the capture
needs the content painted, so that blit's element stays painted (`paintedProxy`) rather than transparent.

What it costs (`node scripts/bench-gpu.js` in cloudcanvas-lib, 10,000 sprites, CPU per frame, headless Chromium on swiftshader):
a camera pan or one sprite moved is 0.1-0.3 ms - the scene rewrites one record, the GPU redraws, nothing is
walked - and every sprite moved is about 20-30 ms against 8-9 ms for the same boxes on the DOM port, since each
gpu blit is also its DOM proxy and one record more. A still board draws nothing. cloudcanvas-lib's `tests/browser/gpu-bench.test.js`
keeps those bounds, and `tests/unit/gpu-gc.test.js` that removed blits leave nothing behind.

## Widgets

A widget (`cloudcanvas-lib/plugins/widget.js`) is a type whose same-named trait holds its contents as options and renders them:
`bind(el, on, dismiss)` finds the instance's nodes (it runs on every write), `render(bindings, contents,
cache)` diffs the contents onto them. Writing the key re-renders; `setContent(b, key, value)` is the call form,
refusing a key the widget does not take before anything is written. The display types (`card`, `media`,
`vector-pointer`, `raw`) and every `cloudcanvas-lib` widget are built this way; a container type defaults to
`layout: 'free'`, so its scope well is sized to its children.

## The board

`cloudcanvas-lib/sandbox/board.js`'s `createBoard(host)` is a root with the standard add-ons named and the root ones on
(pan, keyboard, announce, cursors, history, reactions) and a flying camera. A board saves as a v2 document
(`format.js`): a tree of nodes shaped like blit specs - `id`, placement, `type`, `fill` (the contents), each
trait as `name: true` or its options, surface and flow - plus the *board parts* that name blits rather than
living in one: reactions, pages and folders (the site's sitemap), and the theme. The loader
(`restore-tree.js`) is self-contained, so an exported page embeds its source; it builds each node in steps
(identity and placement, contents, then each trait) so one bad value costs that value, and v1 documents are
migrated on the way in (`migrate-v1.js`). `export-static.js` writes a two-file site - the page and the
board runtime (`cloudcanvas.board.iife.js`, built into cloudcanvas-lib's `dist/`) - that opens from `file://`.

## The site

`cloudcanvas-site/website.js` mounts the builder (`website-sandbox.js`) on one board. A shared `context` carries the
board (`app`), the selection, the profiles (named saves with auto-save), undo/redo (snapshot history), the
panels (structure, inspector, editor, reactions, theme, type creator), the menu registry, quick-search, the
tools (lasso, box-frame, pencil, image drop) and the device frame. Every command a surface offers goes through
`website-sandbox-commands.js`; every widget placed goes through the catalogue's one `place` call.

## Invariants the tests hold

- An idle frame writes nothing; reads never follow a style write in the same phase.
- `import 'cloudcanvas'` exports exactly `blit` and `type`; an add-on imported but unused bundles to nothing.
- The size of every entry is ratcheted (`scripts/size-baseline.json`); growth fails `npm run size:check`.
- `cloudcanvas-lib` imports the core only through published entries.
- `dist/` is current (`npm run check:dist`), and this file's tree is current (`node scripts/tree.js --check`).
- Markup reaches the DOM only through the sinks listed in SECURITY.md.

## Files

Generated by `node scripts/tree.js --write` from each file's own header.

<!-- tree -->
### `cloudcanvas`

- `core/blit.js` - `blit`: a thin handle over any DOM element, HTML or SVG
- `core/camera.js` - The camera: pan, zoom and the fit behind `view()`
- `core/css.js` - The minimal stylesheet a root needs to place blits: the host clips, the plane carries the camera, the overlay sits on top, and every blit is placed absolutely from its container's (or scope's) origin
- `core/frame.js` - The frame: structure, read and write phases, and the one loop every root (a `blit('#app')` host) runs on
- `core/index.js` - CloudCanvas core
- `core/port.js` - The default port: the browser painting the element
- `core/root.js` - The root: what `blit('#app')` does to its host
- `core/spec.js` - `data-*` <-> spec: the one conversion between attributes and the plain object a blit is described by
- `core/state.js` - Per-blit engine state: one record per element in a module WeakMap, so the browser owns the lifetime and nothing is ever unregistered
- `core/type.js` - Types: a potential blit backed by a `<template data-type="name">`, cloned into every instance
- `core/use.js` - Traits, `(b, opts, root) => cleanup`, run while their blit is in a frame, and the names `blit.use()` gives them
- `graphics/primitives/contrast.js` - Color math: relative luminance, contrast, and alpha compositing
- `graphics/primitives/element.js` - `h()`: the one namespace-aware element factory for building live DOM and SVG subtrees
- `graphics/primitives/primitives.js` - Primitive graphics generators for widgets, the overlay's cursors, connectors, vector pointers and badges
- `graphics/style-gates.js` - Style discipline, as a function
- `graphics/theme.js` - Theming: the reference light token set, and the one function that applies it
- `graphics/tokens.js` - `TOKENS`: a JS-readable catalogue of the framework's `--cc-*` design tokens
- `graphics/vectorizer.js` - Vectorizer Subsystem: Converts discrete stroke points, point clouds, and 3D radial sculpt contours into resolution-independent cubic bezier SVG paths, with topology normalization for glitch-free CSS `d: path(...)` morphing
- `index.js` - CloudCanvas (`cloudcanvas`): the core
- `kernel.js` - cloudcanvas/kernel: the surface an add-on is written against
- `log.js` - The logging seam: one dependency-free leaf the plugin and add-ons report through instead of `console`
- `testing.js` - cloudcanvas/testing: seams for driving the core from a test
<!-- /tree -->
