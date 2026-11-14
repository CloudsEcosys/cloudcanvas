<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

# CloudCanvas

The core of a client-side GUI framework, in two exports. A **blit** is a thin handle over any DOM element,
HTML or SVG, placed on an infinite canvas; the DOM tree is the hierarchy, events are native, and state lives in
a `WeakMap` keyed by the element, so the browser owns every lifetime. Everything else - dragging, panning, a
menu, layout, saving - is a plugin from [cloudcanvas-lib](https://github.com/CloudsEcosys/cloudcanvas-lib),
imported only when a page uses it.

```
npm install cloudcanvas
```

Native ES modules, no runtime dependencies. Node.js 20+ for the tooling only.

## Quick start

<!-- quickstart -->
```js
import { blit, type } from 'cloudcanvas';

type('note', { html: '<h3 data-slot="title"></h3><p data-slot="body"></p>' });

const app = blit('#app');     // a root: plane, overlay, camera, one frame loop
const note = app.blit({ type: 'note', x: 40, y: 40, fill: { title: 'Hello', body: 'Placed by the core.' } });
app.on('note:open', (event) => console.log('opened', event.detail.payload));   // blit events bubble to the root
note.set({ x: 60 });          // painted in the next frame's write phase
```
<!-- /quickstart -->

`#app` is any element with a size. That is the whole application: 7.9 KB gzipped. The snippet runs in the test
suite (`tests/unit/readme.test.js`).

## The model

| Concept | What it is |
|---|---|
| **blit** | `blit(el \| selector)` returns the element's handle, the same one every time. Detached or a `<template>`, a blit is *potential* (writes apply at once); inside a root it is *indexed* (placement waits for the frame's write phase); `blit('#app')` on a bare host makes a *root*. |
| **set** | `b.set({...})` routes each key: `x y z w h` to the port, `id` to the element (the root's index), `fill` into `[data-slot]`s as text, a named trait or `port` to its function, everything else to `data-*`. `b.spec` reads it all back, so `parent.blit(b.spec)` reproduces `b`. |
| **tree** | `b.blit(spec)` adds a child (into the blit's `[data-scope]` if its type has one), `b.blits`, `b.parent`, `b.bounds` (global box), `b.remove()`. On a root: `find(id)`, `view(b)` (frame it), `root = b` (promote a branch, hide the rest), `tick(fn, 'read' \| 'write')`. |
| **type** | `type(name, {html, defaults, with})`: a potential blit over a `<template data-type>`, cloned into every instance. Text fills slots; markup only reaches a slot the template marks `data-slot-html`. |
| **trait** | `(b, options, root) => cleanup`. Named with `blit.use({name: fn})`, switched on by a key (`{name: true}`, `{name: {...options}}`, `false` stops it) or by markup (`data-<name>`); anonymous ones ride `with: [fn]`. |
| **port** | `(b, ctx) => void`: what paints a blit. The default writes a `translate3d` and the declared size, each only when it changed; `b.set({port: fn})` swaps it (a canvas, a GPU pass, anything). |
| **events** | `b.emit(type, payload)` is a bubbling, cancelable `CustomEvent` (`detail = {payload, source}`); plugins announce the same way (`drag:start`, `select`, `resize:end`, `view:change`, `remove`...), so `app.on(...)` hears the whole board. |

Markup works too: with the traits named, `<div data-blit data-x="40" data-drag>Hi</div>` inside a root's host
is a live blit the moment the root mounts (`cloudcanvas-lib/observe` picks up markup written later).

## Entries

Sizes are gzipped: what importing that subpath alone costs, the core code it reaches included (`npm run size`).

| Subpath | What it is | gz |
|---|---|---|
| `cloudcanvas` / `cloudcanvas/core` | `blit`, `type` | 7.9 KB |
| `cloudcanvas/kernel` | the surface a plugin is written against (below) | 8.2 KB |
| `cloudcanvas/theme` | `applyTheme`, `LIGHT_THEME`, `TOKEN_PREFIX`: the reference `--cc-*` token set and the one function that applies it | 0.6 KB |
| `cloudcanvas/tokens` | `TOKENS`, `TOKEN_NAMES`, `TOKEN_CATEGORY`, `isToken`, `tokensInCategory`, `lightThemeValue`: the token catalogue, readable from JS | 2.4 KB |
| `cloudcanvas/primitives` | `safeColor`, `safeNumber`, `safeUrl`, contrast helpers, and the SVG generators for badges, connectors, pointers and cursors | 3.0 KB |
| `cloudcanvas/element` | `h(tag, attrs, ...children)`: one namespace-aware factory for live DOM and SVG | 0.7 KB |
| `cloudcanvas/vectorizer` | stroke points, point clouds and radial contours to cubic bezier SVG paths | 1.2 KB |
| `cloudcanvas/log` | `createLogger`, `setLogSink`: a pluggable, non-blocking logger | 0.5 KB |

`dist/` carries the core as single files - `cloudcanvas.esm.js` (one module import, no import map) and
`cloudcanvas.iife.js` (global `CloudCanvas`, the one form that loads from `file://`), each with a `.min`
sibling - and every entry above as its own module under `dist/esm/`.

## Writing a plugin

A trait is a function of the blit, its options and its root, returning its cleanup:

```js
import { blit } from 'cloudcanvas';

const outline = (b, { color = 'gold' } = {}) => {
  b.el.style.outline = `2px solid ${color}`;
  return () => { b.el.style.outline = ''; };
};
blit.use({ outline });
app.blit({ x: 10, y: 10, w: 80, h: 40, outline: { color: 'tomato' } });   // set({ outline: false }) stops it
```

A plugin that needs more than the handle reaches the core through `cloudcanvas/kernel`, and nothing deeper, so
the core's files stay private. Every name there is one cloudcanvas-lib uses; adding one is a minor change,
removing or renaming one is breaking.

| Kernel names | For |
|---|---|
| `blit`, `type`, `use`, `findType`, `isTemplate` | handles, types and trait names |
| `schedule`, `FRAME_MS` | asking a root for a frame |
| `stateOf`, `rootOf`, `parentElementOf`, `parentNodeOf`, `childBlitsOf`, `scopeContainerOf`, `isWithin`, `boundsOf`, `sizeOf`, `holdPlace`, `parkedStateOf` | the per-element state and the tree |
| `attachBlit`, `findBlit`, `indexBlit`, `releaseBlits`, `heldRootOf` | the root's index |
| `defaultPort`, `forgetPlacement`, `formatTransform3D` | painting |
| `Camera`, `multiply` | the camera and its matrices |
| `camelCase`, `decodeAttribute`, `writeAttribute` | the `data-*` spec codec |
| `injectStyle` | a stylesheet put in the page once |
| `BLIT_ATTR`, `ROOT_ATTR`, `SLOT_ATTR`, `SLOT_HTML_ATTR`, `MAX_DEPTH` | the markers |

## Plugins

The add-ons (drag, select, resize, focus, pan, keyboard, menu, layout, history, panel, gpu and the rest), the UI
kit, the widgets, the board and the add-on CSS are [cloudcanvas-lib](https://github.com/CloudsEcosys/cloudcanvas-lib),
one entry each, with `cloudcanvas` as a peer:

```js
import { blit } from 'cloudcanvas';
import { drag } from 'cloudcanvas-lib/drag';
import { pan } from 'cloudcanvas-lib/pan';

blit.use({ drag, pan });
```

Coming from 0.6, where they were `cloudcanvas/<name>`: `node scripts/migrate-0.7.js <dir>` lists every import
that moved, with its 0.7 specifier (the table is in the [changelog](CHANGELOG.md)).

## More

- [GUIDE.md](GUIDE.md): from one blit to a saved, exported board
- [ARCHITECTURE.md](ARCHITECTURE.md): the core, the plugin contract, the files
- [SECURITY.md](SECURITY.md): the markup sinks and what guards them
- [CHANGELOG.md](CHANGELOG.md)

Projects on the 0.4 API can stay on the `legacy/0.4` branch.

## Repositories

CloudCanvas is four repositories, each with one concern. Clone them side by side.

| Repository | Concern | Depends on |
|---|---|---|
| [cloudcanvas](https://github.com/CloudsEcosys/cloudcanvas) | The core: `blit`, `type`, the add-on kernel, theme, tokens and primitives | nothing |
| [cloudcanvas-lib](https://github.com/CloudsEcosys/cloudcanvas-lib) | Every plugin, one entry each: the add-ons (drag, pan, panel, gpu...), the UI kit, the widgets and the board | `cloudcanvas` |
| [cloudcanvas-site](https://github.com/CloudsEcosys/cloudcanvas-site) (private) | The showcase site and sandbox builder | `cloudcanvas`, `cloudcanvas-lib` |
| [cloudcanvas-mcp](https://github.com/CloudsEcosys/cloudcanvas-mcp) (private) | The MCP server, sync hub and web client | `cloudcanvas`, `cloudcanvas-lib` |

## License

MIT. Written by Richard Christopher, NeoTec, LLC.
