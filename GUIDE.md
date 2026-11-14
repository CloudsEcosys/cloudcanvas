<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

# Building with CloudCanvas

A walk from one blit to a saved, exported board. Every snippet uses the published specifiers
(`cloudcanvas`, `cloudcanvas-lib/<add-on>`); the core lives in this repository, the add-ons, the widgets and
the board in cloudcanvas-lib.

## 1. The idea

A **blit** is a handle over an element you already have. The element stays an element: the DOM is the tree,
CSS is the look, and events are native `CustomEvent`s that bubble to whoever listens. The handle adds a place on
an infinite canvas (`x y z`, an optional size), a key-value spec that round-trips through `data-*`, and
**traits**: functions that give a blit a behaviour for as long as it carries the key.

A **root** is the blit you make from a host element: it owns the camera, the frame loop and an index of its
blits by id. Nothing else is built in. Dragging, panning, selection, menus, layout, undoable navigation,
saving - each is an add-on you import, and each costs nothing when you do not.

## 2. A first board

```js
import { blit, type } from 'cloudcanvas';
import { drag } from 'cloudcanvas-lib/drag';
import { pan } from 'cloudcanvas-lib/pan';
import { select } from 'cloudcanvas-lib/select';

blit.use({ drag, pan, select });

type('note', { html: `
  <h3 data-slot="title"></h3>
  <p data-slot="body"></p>` });

const app = blit('#app');
app.set({ pan: true });

const a = app.blit({ id: 'a', type: 'note', x: 40, y: 40, fill: { title: 'First' }, drag: true, select: true });
const b = app.blit({ id: 'b', type: 'note', x: 320, y: 60, fill: { title: 'Second' }, drag: true, select: true });

a.set({ fill: { body: 'Edited' } });     // text, never markup
b.set({ x: 400, w: 220 });                // painted next frame, one transform write
app.view(b);                              // frame it
```

`app.find('a')` returns `a` again; `a.spec` returns `{id: 'a', type: 'note', x: 40, y: 40, fill: {...}, drag: true,
select: true}`, which `app.blit(a.spec)` would reproduce.

## 3. Blits from markup

Name the add-ons, and HTML is enough:

```html
<div id="app" data-pan>
  <div data-blit id="hello" data-x="80" data-y="60" data-drag>Drag me</div>
  <svg data-blit data-x="300" data-y="40" width="80" height="80" data-drag><circle cx="40" cy="40" r="36"/></svg>
</div>
<script type="module">
  import 'cloudcanvas-lib/defaults';          // names every add-on
  import { blit } from 'cloudcanvas';
  blit('#app');
</script>
```

The root scans `[data-blit]` when it mounts; `cloudcanvas-lib/observe` also adopts markup inserted later.

## 4. Types and widgets

A **type** is structure. A **widget** is a type that renders its contents:

```js
import { blit } from 'cloudcanvas';
import { widget, setText, leadingText, contentOf, setContent } from 'cloudcanvas-lib/widget';

widget({
  name: 'counter',
  html: '<button type="button" class="counter"></button>',
  keys: ['label', 'count'],
  bind: (host, on) => {
    const button = host.querySelector('.counter');
    on(button, 'click', () => {
      const b = blit(host);
      setContent(b, 'count', (contentOf(b).count ?? 0) + 1);
    });
    return { text: leadingText(button) };
  },
  render: (bindings, contents) => setText(bindings.text, `${contents.get('label')}: ${contents.get('count') ?? 0}`)
});

const counter = app.blit({ type: 'counter', counter: { label: 'Clicks', count: 0 } });
setContent(counter, 'count', 5);
```

The contents live under the type's key (`counter`), so they save with the blit. `bind` runs on every write and
must only find nodes and attach listeners through `on` (they are removed when the trait restarts). The kit's
widgets are built exactly this way: `createButton(app, {label: 'Save'})` from `cloudcanvas-lib` is
`app.blit({type: 'button', button: {label: 'Save'}, chrome: false})`.

## 5. Traits

```js
function glow(b, options = {}) {
  const color = options.color ?? 'gold';
  b.el.style.boxShadow = `0 0 12px ${color}`;
  return () => { b.el.style.boxShadow = ''; };
}

blit.use({ glow });
a.set({ glow: { color: 'hotpink' } });   // runs now; stored as data-glow
a.set({ glow: false });                  // the cleanup runs
```

A trait receives the blit, its options, and the root record. Options are data: they round-trip through
`data-*` as JSON, so they can be numbers, strings, booleans, arrays and plain objects - never functions (an
add-on that takes callbacks, like `menu(app, {items})`, has a call form for them). Per-frame work goes
through `b.tick(fn, 'read' | 'write')`, which returns its own off: read layout in `read`, write styles in
`write`, and the frame never thrashes. A trait on the root's host is a root trait - that is all `pan`,
`keyboard`, `menu`, `history` and `reactions` are.

## 6. Ports

The port paints. Swap it to draw a blit somewhere other than its own element box:

```js
const canvas = document.querySelector('#layer');
const ctx2d = canvas.getContext('2d');

function dotPort(b, ctx) {
  ctx2d.fillRect(b.x, b.y, 4, 4);        // ctx: {changed, first, camera}
}

app.blit({ x: 12, y: 30, port: dotPort });
```

A named port (`blit.use({dot: dotPort})`, then `{port: 'dot'}`) saves by name.

## 7. Nesting, layout and navigation

`b.blit(spec)` makes a child. A type with a `[data-scope]` element takes its children there; the display widgets
(`cloudcanvas-lib/types`: `card`, `media`, `vector-pointer`) have one, sized to their children by the layout
add-on:

```js
import { layout, gap } from 'cloudcanvas-lib/layout';
import { history, go, back } from 'cloudcanvas-lib/history';
import { registerDisplayTypes } from 'cloudcanvas-lib/types';

blit.use({ layout, gap, history });
registerDisplayTypes();
app.set({ history: true });

const list = app.blit({ type: 'card', card: { title: 'Row' }, layout: 'row', gap: 12 });
list.blit({ type: 'card', card: { title: 'One' } });
list.blit({ type: 'card', card: { title: 'Two' } });

go(app, list);    // promote it: the rest of the board hides, the camera frames it
back(app);        // and return
```

`move(b, parent)` (`cloudcanvas-lib/place`) reparents a blit keeping its place on screen; `reorder(b, before)`
(`cloudcanvas-lib/layout`) moves it among its siblings.

## 8. Events and reactions

```js
app.on('select', (event) => console.log(event.detail.source.el.id, event.detail.payload));
app.on('drag:end', (event) => save());
```

`cloudcanvas-lib/reactions` stores wiring that outlives code: "when `button` is pressed, show a toast on `panel`".

```js
import { reactions, reactionsOf } from 'cloudcanvas-lib/reactions';
blit.use({ reactions });
app.set({ reactions: true });
reactionsOf(app).add({ source: 'button', signal: 'press', action: { type: 'notify', target: 'panel', params: { message: 'Hi' } } });
```

## 9. Appearance

Every colour and metric is a `--cc-*` token with a fallback; `applyTheme(host, LIGHT_THEME)`
(`cloudcanvas/theme`) swaps a whole set on one host. Per-blit overrides go through the style add-on's whitelist:
`b.set({style: {radius: 14, background: '#123'}})`. The display widgets wear the card surface unless
`chrome: false`; `bordered: false` hides only the border; their sections are classed `CLS` (`cloudcanvas-lib/types`:
`cloudcanvas-card-title`, `cloudcanvas-card-body`, ...).

Each add-on puts its own CSS in the page once, the first time it runs: the card surface with the display
widgets, the ring with `select`, the grip with `drag`. `createBoard` and `cloudcanvas-lib/defaults` add the board's:
the canvas surface and type on the root, and no text selection under a gesture. On the bare core,
`injectBoardStyles()` (`cloudcanvas-lib/graphics`) adds the same, and `injectCanvasStyles()` every chunk at once.

## 10. Panels

`cloudcanvas-lib/panel` gives a page regions that float, attach to an edge, open as a modal, fill their host, fold
away and share a frame as tabs. They live on a layer of their own over a positioned host, so the camera of a board
underneath never moves them:

```js
import { blit } from 'cloudcanvas';
import { panel, panels, setPanel, panelOf, bodyOf } from 'cloudcanvas-lib/panel';

blit.use({ panel });                         // cloudcanvas-lib/defaults names it too
const layer = panels(document.querySelector('#shell'));     // the board's host goes inside #shell
const sheet = layer.add(document.querySelector('#sheet'), { id: 'sheet', at: 'right', title: 'Sheet' });

setPanel(sheet, { at: 'float' });            // merge a patch into its options
panelOf(sheet);                              // its options, whole and normalised
bodyOf(sheet);                               // the body element holding #sheet, never rewritten
layer.snapshot();                            // { sheet: {...} }: plain data, yours to keep
layer.apply({ sheet: { at: 'full' } });      // patches by id
layer.off();                                 // #sheet goes back where it came from
```

A panel says where it is with three settings: `at` (`float`, `left`, `right`, `top`, `bottom`, `modal`, `full`,
`window`), `pinned` (an edge panel takes its own space, or
lies over the content as a drawer) and `collapsed` (an edge folds to a 28px tab, a float to its bar). `box` is the
floating box, `places` where a person may put it, `controls` the bar's buttons. `size` is an edge's thickness per
axis, `{x, y}`: `x` on the left and right, `y` on the top and bottom. A number sets both, and `panelOf` always
answers `{x, y}`; sizing on an edge, by its handle or by Shift with the arrows, changes only that edge's axis, and a
panel joining an edge that already holds one takes that slot's size on that axis. Markup works too:
`<section data-blit data-panel='{"at":"left","title":"Notes"}'>` inside a `[data-cc-panels]` element.

Placement keeps every bar in reach. A floating box is held to the layer - no larger, its bar inside - while the
`box` you stored stays as it was, so a layer that grows gives it back. Opposite pinned strips leave the content at
least 80px, each giving way in proportion but never below its `min`; a drawer runs between the pinned strips on
the edges it meets, so it never covers another panel's bar. `placeOf` refuses a layer size it cannot use.

Open panels in one place are tabs of one frame: an edge, `modal` and `full` are one place each, and floating panels
share one when they share a `group`. The bar drags (it lifts a panel off an edge, and snaps it to an edge within
`snap` px, showing the strip it will take there, that slot's size included); the resize add-on sizes it; arrows
move a focused bar, Shift with them sizes. A modal holds the keyboard and every press outside it until it closes,
and while a panel is modal or full the others are `inert`. When a modal closes, the focus goes back to the element
that had it before, if that is still in the page and shown - one inside the panel only if the panel still shows;
otherwise the add-on leaves the focus alone, and you decide on `panel:change`. Content makes room by reading `--cc-panels-top`, `-right`, `-bottom` and `-left`,
which the layer writes on the host:

```css
#board { position: absolute; inset: var(--cc-panels-top, 0px) var(--cc-panels-right, 0px) var(--cc-panels-bottom, 0px) var(--cc-panels-left, 0px); }
```

`at: 'window'` moves the frame, bar included, into a browser window of its own, with the page's stylesheets copied
in (no scripts). Put it there from a press - the place menu offers it when `places` lists `window` - since a popup
blocker allows a window only inside a gesture; when none opens, the panel stays and emits `panel:refused`. Closing
the window, its close control, or setting `at` elsewhere brings the frame back to the place it came from; panels
sharing a `group` share one window as tabs. While away the content is in the other window's document, so code that
listens on your own `window` or `document`, or looks content up with `document.querySelector`, will not reach it.
Reach it through `bodyOf(b)`, and attach what it needs to the window `panel:change` hands you:

```js
let offKeys = () => {};
sheet.on('panel:change', (event) => {
  const win = event.detail.payload.window ?? window;     // null: back in this window
  offKeys();
  const onKey = (keyEvent) => handleKey(keyEvent);
  win.addEventListener('keydown', onKey);
  offKeys = () => win.removeEventListener('keydown', onKey);
});
```

Stylesheets added to the page after the window opened are not in it; nor are scripts, which run in the opener.

## 11. The board: saving, loading, exporting

```js
import { createBoard, serializeBoard, deserializeBoard, saveSandbox, loadSandbox, downloadStaticSite } from 'cloudcanvas-lib/sandbox';
import { registerBaseTypes } from 'cloudcanvas-lib';
import { registerComponents } from 'cloudcanvas-lib/components';

registerBaseTypes();
registerComponents();
const app = createBoard('#app', { label: 'Project board' });   // a root with the standard add-ons on

const doc = serializeBoard(app);          // {version: 2, blits: [...], reactions?, pages?, theme?}
const { warnings } = deserializeBoard(otherBoard, doc);
saveSandbox('draft', app);                // localStorage, namespaced
await downloadStaticSite(app, 'site.zip'); // index.html + cloudcanvas.board.iife.js (from cloudcanvas-lib's dist/), opens from file://
```

Saved documents from 0.4 (format v1) load through the same call.

## 12. Staying fast

- Write through `set`; the frame batches placement into one transform per blit per frame.
- Put layout reads in `read` ticks and style writes in `write` ticks.
- `offload: true` parks top-level blits that are far off screen; `lazy` loads children on demand.
- An idle board runs no frames.
- Thousands of plain boxes or sprites: put them on the `gpu` port.

## 13. GPU and 3D

`gpu(app)` draws blits on the GPU - WebGPU where the browser has it, else WebGL2 - from one shared scene. It
names the port `gpu`; a blit on it draws its `tint`, or what `gpuContent` gives it, and its element stays in
the DOM, transparent, as its hit proxy, so events, `hit()`, keyboard roving and screen readers work as before.

```js
import { gpu, gpuContent } from 'cloudcanvas-lib/gpu';
import { orbit, level } from 'cloudcanvas-lib/orbit';

const layer = gpu(app);                  // await layer.ready -> 'webgpu' | 'webgl2'
app.blit({ x: 40, y: 40, w: 200, h: 120, port: 'gpu', tint: '#38bdf8' });

const sprite = app.blit({ x: 300, y: 40, w: 64, h: 64, port: 'gpu' });
gpuContent(sprite, { texture: image, uv: [0, 0, 0.5, 0.5] });   // an image, canvas, video or ImageBitmap

blit.use({ orbit });
app.set({ orbit: true });                // Alt + drag turns, Alt + wheel moves the viewer; level(app) flattens
```

- The camera itself is 3D: `perspective` (px) and `rotateX` / `rotateY` (degrees) tilt the plane about the
  host's centre, and pointer input still lands on the canvas plane. DOM and GPU blits line up at any tilt.
- The GPU draws only on frames where a drawn blit changed or the camera moved.
- A gpu blit's DOM children are hidden with its proxy; draw them as gpu blits too, or keep them beside it.
- So is anything the element itself shows: its focus outline, the select ring, resize handles, a drag grip. Use
  `cursors` for the focus reticle and selection ring (it draws in the overlay), or `paintedProxy(b)` for a blit
  whose element must stay visible.
- A gpu blit in a `layout: row | column | grid` container keeps drawing: the layout places its element and the
  GPU draws it there, and it still saves as `port: 'gpu'`.
- Textures must be same-origin or served with CORS: the browser refuses a tainted image.

What a gpu blit draws comes from the content add-ons, each a trait (or a call) on the same port:

```js
import { sheet, sprite } from 'cloudcanvas-lib/sprites';
import { text } from 'cloudcanvas-lib/text';
import { mesh } from 'cloudcanvas-lib/mesh';
import { video } from 'cloudcanvas-lib/video';
import { ownCanvas, redraw } from 'cloudcanvas-lib/own-canvas';
import { svgPath } from 'cloudcanvas-lib/svg-path';

blit.use({ sprite, text, mesh, video, svgPath });
sheet('hero', { src: 'hero.png', grid: { w: 32 }, animations: { run: { frames: [0, 1, 2, 3], fps: 12 } } });

app.blit({ x: 0, y: 0, w: 64, h: 64, port: 'gpu', sprite: { sheet: 'hero', play: 'run' } });
app.blit({ x: 80, y: 0, w: 200, h: 40, port: 'gpu', text: { value: 'Score 42', font: '600 24px system-ui' } });
app.blit({ x: 300, y: 0, w: 80, h: 80, port: 'gpu', tint: '#f97316', mesh: { shape: 'box', rotate: [20, 30, 0] } });
app.blit({ x: 400, y: 0, w: 320, h: 180, port: 'gpu', video: { src: 'clip.mp4', loop: true } });
ownCanvas(chart, (ctx, { w, h }) => { ctx.fillRect(0, h / 2, w, 1); });   // redraw(chart) after the data changes
app.blit({ w: 48, h: 48, port: 'gpu', svgPath: { d: 'M4 12 L12 4 L20 12 Z', viewBox: [0, 0, 24, 24], stroke: '#0f172a' } });
```

Every sprite of one sheet is one texture and one batch; every box one geometry. Each also works without a
GPU: a sprite is its element's CSS background, text is the element's text, a video and a canvas are elements.

Layers: the canvas sits under the plane, so DOM blits draw over GPU ones. `gpu(app, {layer: 'over'})` puts it on
top instead, and a DOM blit wearing `punch` (`blit.use({ punch })`, then `punch: true`) clears the GPU pixels
under it at its `z`, so it shows through - GPU blits above that `z` still draw over it. Where the browser has
HTML-in-Canvas (Chromium behind `--enable-blink-features=CanvasDrawElement` today), `htmlCanvas(b)`
(`cloudcanvas-lib/html-canvas`) draws a gpu blit's live HTML through the GPU - tilted and layered with GPU content -
while its inputs stay in the DOM; elsewhere it returns null and changes nothing.

A board can also come from XML - `fromXml(app, source)` (`cloudcanvas-lib/xml`): tags name types (`blit` is a
plain one), attributes are spec keys, a child element named for a slot fills it, other children nest. The
whole document is read and checked before anything is built, and nothing from it is ever markup.

## 14. Coming from 0.4

The 0.4 session API and its element classes are gone. The CHANGELOG's 0.5.0 entry has the full table;
`node scripts/migrate-0.5.js <dir>` lists every 0.4 call in a codebase with its 0.5 form.
