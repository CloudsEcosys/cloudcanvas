<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 12 - GPU Ports and the 3D Camera

## Context

Phase 11 (`plans/phase-11_blit-core-cleanup.md`, exits at tag 0.5.0) delivers the whole Blit core:
`blit` and `type` as the only exports, ports as the binding between a blit and whatever draws it, traits
as functions, `tick` phases, `use()`, the Pin deletion, thin-core packaging and the restructure. Phase 12
starts from that and adds what the browser does not paint for free: a `gpu` port with WebGPU and WebGL2
backends, content types and ports (sprites, svg-path, xml, text, mesh), DOM/GPU compositing, and a
perspective camera so the site is one 3D website sandbox. No Rust/wasm, no runtime shader transpilation.
The operating protocol (trees P/S/L/X, single committer, per-step Dev → QA → Fix → Verify) is inherited
from Phase 11 verbatim.

### Phase renumbering note

Inserting this phase moves the later phases named in the superseded `phase-11_core-cleanup-soc.md` up by
one. That file is not edited; this table is the record.

| Phase 11 plan says | Now | Content as Phase 11 describes it |
|---|---|---|
| Phase 12 | Phase 13 | Self-contained repos (own `package.json`, tests, dist per repo) |
| Phase 13 | Phase 14 | Track D, gesture split, S13.3 undo/redo font-size flip |
| Phase 14 | Phase 15 | Not named in the Phase 11 file |
| Phase 15 | Phase 16 | `pre-figma` ratchet due date, computed-style goldens |

### Relation to GPLAN

The GPLAN restructure (`src` → `.plugin`, `lib` → `.addons`, `examples` → `.site`, parent → private
`CloudsEcosys/cc-main`) is executed in Phase 11 S1 and GPLAN.md is deleted in S9. Phase 12 add-ons land
directly in `.plugin/addons/*` (engine-side: gpu, backends, camera, compositing) and `.addons/*`
(library-side: content types), one subpath export each. No path retarget is needed here.

## Delivered by Phase 11 (dependencies)

| Phase 12 relies on | Phase 11 sprint | Used for |
|---|---|---|
| `blit` / `type` / `port (b, ctx)` contract | S2, S4 | `gpu` is a port; content ports bind through the same contract |
| Native events: core listener first on each element, hooks run in the bubble phase, cancel stops propagation | S3 | GPU hit-test dispatches native events; no event code here |
| `tick(fn, 'read' \| 'write')` | S4 | backend upload and draw in write; culling and picking in read |
| `blit.use({name: fn})`, late-upgrade of `[data-name]` | S4 | installing ports, backends and camera controls |
| Camera on the root blit (`camera.js`), `formatTransform3D` in the default port | S2 | extended to a projection matrix; CSS3D sync reads it |
| Subpaths per add-on, `sideEffects` allowlist, `/*@__PURE__*/` | S6 | backends by dynamic import only |
| Size ratchet G9 (`scripts/size.js`, `size-baseline.json`) | S0, S6 | every add-on and backend gets a row |
| `[data-blit]` scan, MutationObserver trait attach/cleanup | S5 | non-painting handles are ordinary blits |
| `.site` as one 3D sandbox, `svg-3d-sculpt` 3D state folded in | S8 | the perspective camera has a host |

Phase 11 calls the camera "Viewport, trimmed"; Phase 12 assumes it exposes a matrix or can be given one
without changing its 2D API (**Proposed**, see D3).

## Vocabulary

| Term | Meaning |
|---|---|
| port | the function binding a blit to what draws it; default is the browser |
| `gpu` port | add-on; draws the blit on the shared GPU canvas; the blit's DOM handle is non-painting |
| backend | add-on behind the `gpu` port, chosen at runtime by dynamic import: `webgpu`, then `webgl2` |
| content type | a `type()` whose `<template>` and spec describe the content (sprite, mesh, xml node) |
| content port | a port that rasterises or tessellates a type for the `gpu` port (svg-path, text) |

| Item | Kind | Drawn by | Ships in |
|---|---|---|---|
| html / svg element | type (default) | the browser | core |
| media (`img`, `video`) | type | the browser | `.addons/media` |
| own-canvas (`<canvas>` with 2d/gl2/gpu context) | type | the blit's own context | `.addons/own-canvas` |
| sprite | type on the `gpu` port | `gpu` port | `.addons/sprites` |
| mesh | type on the `gpu` port | `gpu` port | `.addons/mesh` |
| xml | type loader (elements → blits, no `innerHTML`) | default or `gpu` port | `.addons/xml` |
| svg-path | content port (tessellation) | `gpu` port | `.addons/svg-path` |
| text | content port (Canvas2D → atlas texture) | `gpu` port | `.addons/text` |

Rules: backends and content add-ons are reached only through `import()`; `sideEffects` stays an
allowlist; a blit on a non-default port keeps its DOM handle for hierarchy, events and state, but the
handle paints nothing.

## Architecture

```
 core (.plugin/core): blit  type  port(default)  tick  use()  root camera (matrix)
        │ use()                              │ port
 ┌──────┴───────────────┐     ┌──────────────┴─────────────────────────────────┐
 │ camera add-ons       │     │ gpu port (.plugin/addons/gpu)                  │
 │  perspective         │     │  resource cache  batch builder  probe  picking │
 │  orbit controls      │     │  backend = await import(webgpu | webgl2)       │
 └──────────────────────┘     │  content: sprites mesh xml svg-path text       │
                              │  compositing: css3d-sync hole-punch html-in-canvas (flag) │
                              └────────────────────────────────────────────────┘
```

## Exit criteria

| # | Exit criterion | Measured by |
|---|---|---|
| E1 | Core exports remain exactly `blit`, `type`; core chunk has no backend or content symbol | G4 snapshot, G9 symbol grep |
| E2 | Backends load only by dynamic import | static-chunk grep in the size report |
| E3 | One DOM tree holds default-port and `gpu`-port blits under one camera; hit-test resolves both to native events | browser tests on both tiers |
| E4 | Same scene renders under WebGPU and forced WebGL2 within pixel-diff tolerance | G10, G11 |
| E5 | sprites, svg-path, xml, text, mesh, media, own-canvas each a separate subpath with a size row | size report |
| E6 | Perspective camera with orbit controls drives the `.site` sandbox; 2D scenes unchanged | browser golden of a 2D layout; orbit browser test |
| E7 | Phase 11 exit checks still green (size floors, vocabulary grep, fresh clone) | phase-exit run |

Out of scope: runtime shader transpilation, physics or animation systems, HTML-in-Canvas as anything
but progressive enhancement, glTF (**Proposed** later).

## Sprints

### S12.0 GPU port add-on, backends and perspective camera (trees S, P)

| Track | Work | Accept |
|---|---|---|
| T0.1 | `gpu` port: capability probe (`navigator.gpu`, then WebGL2), resource cache, batch builder, write-phase draw tick, read-phase culling against blit bounds; registers through `blit.use({gpu})` | core chunk free of backend symbols; probe unit-tested with both answers |
| T0.2 | WebGPU backend: device, swap chain, instanced quad pipeline, mesh pipeline, uniform camera | renders the fixture scene; G10 |
| T0.3 | WebGL2 backend: same pipeline set, `drawArraysInstanced`, no compute; instance update and culling on the CPU | forced fallback matches within tolerance; G11 |
| T0.4 | Shader sources per D1; one fixture scene rendered by both backends | shader files counted per backend in the size report |
| T0.5 | Perspective camera: extends the root camera with a projection matrix (ortho default kept); `{x, y, scale}` stay as derived getters | every camera test passes unmodified; matrix round-trip test |
| T0.6 | Orbit controls add-on (`.plugin/addons/orbit`): pointer and wheel, inertia, target, installed by `use()` **Proposed** | browser test; 0 bytes when not imported |
| T0.7 | GPU picking: read-phase hit-test for `gpu`-port blits, result dispatched as native events on the handle | pointer tests pass for `gpu` blits unchanged |

### S12.1 Content types and ports (tree L / `.addons`, P)

| Add-on | Baseline | Later |
|---|---|---|
| media | `img` / `video` types | none |
| own-canvas | `<canvas>` type with 2d, WebGL2 or WebGPU context | none |
| sprites | atlas loader, instanced quads, per-instance depth | animation clips |
| mesh | box, plane, sphere, indexed buffers | glTF **Proposed** |
| xml | loader mapping elements to blits by `type()`, no `innerHTML` | schema hooks |
| svg-path | tessellation port; stencil-then-cover and Loop-Blinn as separate add-ons | none |
| text | Canvas2D → atlas texture port | Slug-style curves |

Accept per add-on: own subpath, own size row, browser test on both tiers, SECURITY sink review for
anything that parses strings.

### S12.2 DOM/GPU compositing (trees S, L, P)

| Track | Work | Accept |
|---|---|---|
| T2.1 | GPU canvas placement per D2; default keeps today's DOM-only scenes pixel-identical | browser golden of a Phase 11 layout unchanged |
| T2.2 | CSS3D sync: default-port blits with depth get `matrix3d` from the shared camera; the default port reads the camera, not `styles.js` | default and `gpu` blits at the same depth align within 1 px |
| T2.3 | Hole-punch pass (over-plane mode only): depth-only quads at default-port blit bounds | occlusion browser test |
| T2.4 | HTML-in-Canvas behind feature detection and a flag, off by default | no code path reachable without the flag |

### S12.3 Hardening (trees P, plus S and L pointer files)

| Track | Work |
|---|---|
| T3.1 | Test matrix: unit for camera, probe, picking, resource cache lifecycle; browser on WebGPU and forced WebGL2 |
| T3.2 | Benchmarks: 10k sprites, 1k default blits plus 10k sprites, frame time and memory on both tiers; GC test that a detached `gpu` blit releases its resources |
| T3.3 | Docs: one section per add-on and backend in ARCHITECTURE and GUIDE; size report published |
| T3.4 | Size ratchet tightened to the measured floor for every new row |
| T3.5 | Close: PDL retrospectives, re-bundle, version cut per D4 |

## Quality gates

Phase 11 gates and exit checks apply unchanged (G9 included). Added:

| Gate | Command | Pass |
|---|---|---|
| G10 WebGPU run | `npm run test:browser -- --tier webgpu` | `# fail 0`, `# skipped 0`; skips fail because headless Chrome lacks a GPU without flags |
| G11 forced WebGL2 run | `npm run test:browser -- --tier webgl2` | same scene, same assertions, WebGPU disabled by flag |

Phase exit: E1 to E7, three consecutive full runs on both tiers, fresh-clone proof, adversarial review
with zero confirmed critical or high findings, PDL S12.0 to S12.3 closed.

## Risk register

| Risk | Mitigation |
|---|---|
| WebGPU blocklists shrink real coverage below the caniuse figure | WebGL2 first-class from S12.0, G11 on every GPU track |
| Side-effect registration leaks a backend into the static chunk | `sideEffects` allowlist, `/*@__PURE__*/`, G9 symbol grep, `import()` only |
| No compute on WebGL2 | CPU-side instance update and culling is the baseline; WebGPU compute is an optimisation |
| DOM and GPU composite only as whole layers, so occlusion is approximate | hole-punch plus CSS3D sync; HTML-in-Canvas never load-bearing |
| Perspective camera breaks 2D behaviour | ortho default, `{x, y, scale}` getters kept, camera tests unmodified |
| Event order for `gpu` blits: picking must dispatch on the handle so Phase 11's bubble-phase hook order holds | picking emits native events on the handle only; Phase 11 characterisation tests rerun on `gpu` blits |
| Shader sources drift between WGSL and GLSL | one fixture scene pixel-diffed in G10 and G11 |
| GPU resources outlive detached blits | resource cache keyed by the WeakMap state; T3.2 GC test |

## Open decisions

| # | Decision | Recommendation | Needed by |
|---|---|---|---|
| D1 | Shader source | Hand-written WGSL plus GLSL 300 es for a fixed set (instanced quad, mesh, hole-punch); a generator only past about six pipelines. **Proposed** | S12.0 Definition |
| D2 | GPU canvas position | Under the plane by default; opt-in over-plane with hole-punch; interleaved depth bands as a later add-on. **Proposed** | S12.2 Definition |
| D3 | Perspective camera placement | Projection matrix extends the root camera in the core; orbit controls as an add-on. **Proposed** | S12.0 Definition |
| D4 | Version at exit | 0.6.0, additive over 0.5.0. **Proposed** | S12.3 |

## QA log

One row per QA pass, appended by the QA agent, same columns as Phase 11 plus the tier (webgpu, webgl2,
dom) and the G9 size delta.

## Execution design (2026-09-28)

Measured before starting: headless Chromium here gives **WebGL2 by default** and **WebGPU with
`--enable-unsafe-webgpu`** (adapter `google/swiftshader`) on a secure origin (`http://127.0.0.1`; a `data:`
page has no `navigator.gpu`). G10 runs the browser suite with that flag; G11 forces the WebGL2 backend.

| Piece | Design |
|---|---|
| Setup | `gpu(app, {backend: 'auto' \| 'webgpu' \| 'webgl2', layer: 'under' \| 'over'})` - a call on the root like `motion(app)`: a `<canvas data-blit-gpu>` in the host under the plane (D2), sized to the host at device pixel ratio, the backend loaded by `import()` only (E2). |
| Port | The named port `gpu` (`b.set({port: 'gpu'})`): writes the blit's instance record (global box, `z`, its content descriptor) into the batch, and still writes the DOM transform - the element stays as an invisible hit proxy (`opacity: 0`), so pointer events, `hit()`, keyboard roving and the accessibility tree work unchanged (E3 without a separate picking pass; T0.7 becomes the proxy). |
| Frame | One write-phase pass after the root's paint: upload changed instances, draw; nothing when no gpu blit changed and the camera did not move (the idle invariant). |
| Camera | `projection` on the core camera (ortho default, `{x, y, scale}` kept - D3); perspective drives both the GPU view matrix and the plane's `matrix3d`, so DOM and GPU blits at the same depth align (T2.2). `orbit` add-on for pointer/wheel orbiting. |
| Backends | One scene format (instances: box, depth, uv rect, texture, colour); WebGL2: instanced quads, `drawArraysInstanced`; WebGPU: the same pipeline in WGSL (D1: hand-written, one fixture scene pixel-diffed across both). |
| Content | `sprites` (atlas + named frames), `text` (Canvas2D to an atlas texture), `svg-path` (path -> triangles), `mesh` (box/plane/sphere), `media` (`video` type beside `media`), `own-canvas` (a `<canvas>` type with a draw function), `xml` (`DOMParser` XML -> blit specs by registered type; attributes -> keys, text -> fill; never `innerHTML`). Each its own subpath and size row (E5). |
| Site | Sprites and XML import as sandbox tools; the orbit camera as a view mode (E6). |

## S12.0 result (2026-09-29)

Core camera 3D (`perspective`, `rotateX`, `rotateY`, `view`/`projected`/`project`/`unproject`, null behind the
viewer); `gpu` (setup, named port, hit proxies, scene, idle draw pass, `snapshot`, custom backend function);
WebGPU + WebGL2 backends pixel-identical on the fixture scene; `orbit`. Both tiers in `npm run test:browser`
(`GPU_ARGS` in the harness). QA: 2 high, 1 medium, 1 low found and fixed with regression tests.

Deviation from the table above: culling is deferred to S12.3 and benchmark-driven - the GPU clips off-screen
quads itself, and a CPU cull on every camera move costs more than it saves below the 10k-sprite mark.

## S12.1 design (2026-09-29)

| Piece | Design |
|---|---|
| Scene | A texture released and retained within one frame is kept (drops are decided at `pack()`), so a trait restart never re-uploads. |
| Mesh contract | A record with `mesh: {vertices: Float32Array [x,y,z,nx,ny,nz]*, indices: Uint16Array/Uint32Array}` plus `transform` (mat4, mesh -> canvas px), `color`, `lit` joins the same z-ordered batch list as `{mesh: id, transform, normal (mat3), color, lit}`; `pack()` adds `meshUploads`/`meshDrops`; backends gain `mesh(id, geometry)`/`dropMesh(id)`. Meshes depth-test (less-equal, depth write) against each other only - a depth buffer cleared each frame; quads never test or write depth. Lit shade `0.35 + 0.65 * max(dot(n, L), 0)`, `L = normalize(-0.4, -0.6, 0.7)` (canvas space: y down, z toward the viewer). |
| `mesh` | `box` / `plane` / `sphere` unit geometry scaled to the blit's box and a `depth`; `rotate: [x, y, z]` degrees about its centre. |
| `svg-path` | Path data -> flattened subpaths (lines, cubic/quadratic curves, arcs) -> fill triangles (ear clipping with hole bridging, nonzero/even-odd) and stroke triangles (bevel joins); unlit meshes on the same contract. |
| `sprites` | `sheet(name, {src, frames, grid, animations})` + the `sprite` trait: a sheet is one texture, a frame its uv rect; the CSS background shows the same frame without a GPU; one ticker per root, busy only while something plays. |
| `text` | Canvas2D raster to a texture at device ratio x the camera's zoom bucket (re-rastered on crossing a power of two); the proxy keeps the text for the accessibility tree. |
| `media` | A `video` source as a texture re-uploaded per video frame (`requestVideoFrameCallback`, else per frame while playing). |
| own-canvas | `canvas2d(b, draw)`: a `<canvas>` in the blit, `draw(ctx, size)`; `redraw(b)` re-uploads. |
| `xml` | Done ahead: `fromXml(parent, source, {types, keys, html, limit})`, DOMParser XML, two-phase (read and check, then build). |

## S12.1 result (2026-09-29)

Meshes on both backends (lit, depth-tested among themselves, pixel-identical); `gpuContent` parts; the scene's
counted textures and geometries (a let-go-and-retaken source is never re-sent). Content add-ons, each its own
subpath and size row: `mesh`, `svg-path` (parse, flatten, earcut-style fill with holes, bevel stroke; bounded
work), `sprites`, `text`, `video` (the subpath is `video`: `media` is the display widget), `own-canvas`, `xml`.
The `gpu` size row now counts only what loads up front; the backends are rows of their own (`+webgl2`,
`+webgpu`). QA: 1 critical (a trait name accepted as a port, reachable from XML), 2 medium - fixed: a throwing
port falls back to the default port, XML takes `port` only from a `ports` allowlist, `ownCanvas` ends with its
blit, WebGPU skips malformed geometry like WebGL2. Open for Richard: a separate registry for ports (a change to
`blit.use`) would close the name overlap for the board loader too.

HTML-in-Canvas is present in this Chromium (151) behind `--enable-blink-features=CanvasDrawElement`
(`canvas.layoutSubtree`, `drawElementImage`, `texElementImage2D`): S12.2 feature-detects it and tests under
that flag.

## S12.2 result (2026-09-29)

Compositing:
- One camera for CSS 3D and GPU, so DOM and gpu blits at one `z` land together (a browser test under
  perspective).
- Erasing quad runs in both backends, and the `punch` trait: a DOM blit shows through an `over` canvas at its box
  and `z`.
- `cloudcanvas/html-canvas`: live HTML captured by `drawElementImage` into a texture, feature-detected and tested
  under `--enable-blink-features=CanvasDrawElement`. The capture needs the content painted, so that blit's element
  stays painted (`paintedProxy`) and the canvas clears itself after each capture.

Site (E6):
- a 3D view toggle, which is the `orbit` trait and `level`;
- Import XML (palette types, no ports, `html` in JSON attributes refused, ids made unique);
- Import sprite sheet (an inline-sheet `sprite`, now a board trait, so saves, reloads and static exports carry
  it).

Open for Richard:
- under a tilt, the browser's hit-testing among coplanar layers can pick the board's full-size background over a
  card. The site makes that layer ignore clicks while 3D is on; a core fix would change how the plane stacks
  blits in 3D;
- ids that another attribute names (a `connect` target) are not rewritten when an XML import renames an id.

## S12.3 hardening (2026-09-29)

- `scripts/bench-gpu.js` measures 10k sprites, per frame on the CPU:
  - a pan or one move is 0.1-0.3 ms (from 20 ms before this sprint's fixes: the sweep was O(n) on any change);
  - moving all is about 20-30 ms against 8-9 ms on the DOM port, because the DOM proxies stay.
  - `tests/browser/gpu-bench.test.js` guards these bounds.
- `tests/unit/gpu-gc.test.js`: removed blits and their textures are collectable.
- Core: `set()` re-runs traits only when a key naming them changed.
- E1 is checked in the packaging test: no GPU or content symbol in the core bundles.
- Candidate, not built (an API decision): a port that draws on the GPU with no DOM proxy, for particle-scale
  counts.

## Phase exit review (2026-09-29)

The final adversarial review (whole phase) found 1 high, 7 medium and 6 low, plus gaps in three exit tests. All
are fixed with tests except where noted.
- **High:** a gpu child of a layout container lost its port to `flow`. Now a stand-in port holds the one it
  replaced (`state.heldPort`), `spec` names the held one, and `gpu` runs `inFlow`.
- **Medium:**
  - the core now watches host resizes;
  - pan, wheel and pinch keep the grabbed point under the cursor under a tilt;
  - offload's visible rect is tilt-aware;
  - site tools handle null points;
  - the board saves `tint` and warns on a dropped port;
  - sprite grids are capped;
  - no orphan canvas after `destroy()`, and WebGL2 loses its context;
  - `text` writes into its own span.
- **Low:** own-canvas ends with an ancestor; hidden sprites let the loop sleep; the root keeps an author's host
  perspective; the loader's warnings can't throw on hostile ids or types; the docs are refreshed from
  `size.js`.
- **Open:** the proxy hides a gpu blit's focus ring and handles (documented; use `cursors` or `paintedProxy`), and
  keyboard `reveal()` still uses flat maths under a tilt.
- **Exit tests:**
  - E1 now bundles the real core;
  - E3 is a real pointer and keyboard test on gpu blits (both tiers);
  - E6 is a 2D golden captured from the 0.5.0 release (7 pages, 93 boxes, half a pixel).
