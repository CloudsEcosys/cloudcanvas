<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Security

CloudCanvas runs entirely in the browser with no backend and no runtime
dependencies. That removes whole classes of risk, and it concentrates the
remaining risk in one place: content that arrives from outside the page and
ends up in the DOM.

This file records the security model, the invariants the current defences rest
on, and every probe run against them. It is appended to, not rewritten.

## Reporting

Open an issue at https://github.com/CloudsEcosys/cloudcanvas/issues. If the
report includes a working exploit, mark the issue private or send it directly
to the maintainer rather than filing it in the open.

## Trust boundaries

Trusted, because the page author wrote it:
- Blit contents set through the API by first-party application code.
- Type markup (`type(name, {html})`, a widget's `html`): constant structure, never data.
- The sandbox pencil tool, which authors vector blits from its own validated path data.

Untrusted, because it crosses into the page from elsewhere:
- Custom type definitions fetched from the community catalogue.
- Custom type definitions imported from a file.
- Anything already sitting in `localStorage`, which may have been written by an
  older build before a defence existed.
- Any saved board restored from disk or storage.

Content reaches markup only through the sinks listed under "Markup sinks (0.5.0)"
below; everything else renders through Text nodes, which the DOM escapes. The one
sink content can steer is the `html` key of a `card` or `raw` blit, so the
defences below sit around that single key, on every path by which untrusted
content can reach it.

## VULN-001: stored XSS via a custom type `html` field

Status: fixed. Commits `src f22f7d5`, `lib cf17c90`, `examples 9e45ec0`,
`parent 0812267`.

A custom type declaring a field keyed `html` passed validation, was saved, and
its value was then assigned to `innerHTML` when an instance was placed. It
re-executed on every reload and was written verbatim into every exported static
site. Type validation rejected only keys beginning with the `cc:` prefix, so
nothing stopped `html`.

The engine contract was deliberately left alone, because `card` plus `html` is
documented, tested API and the pencil tool depends on it. The fix sits at three
product-layer chokepoints instead:

(Paths below are as of the fix; since 0.7.0 they live in `cloudcanvas-site/custom-types.js`,
`cloudcanvas-site/website-sandbox-type-validation.js` and `cloudcanvas-lib/sandbox/restore-tree.js`.)

1. Loader. `normalizeField` in `lib/sandbox/custom-types.js` drops
   reserved-keyed fields. Every producer funnels through it: the in-app
   creator, the catalogue import, and any definition already poisoned in
   storage.
2. Gate. `fieldsProblem` in `examples/website-sandbox-type-validation.js`
   rejects a reserved key with a message, for fields and for slot fields.
3. Restore. `restoreTree` in `lib/sandbox/serialize.js` strips the `html` key
   from any node carrying a `cc:typeName` marker and records a warning. This is
   what disinfects sessions and exports poisoned before the fix shipped.

## Invariants

These are load-bearing. Breaking one silently re-opens VULN-001.

**INV-1: the engine must never normalize content keys.**
The defences are safe by asymmetry, not by completeness. The guards match on the
trimmed key, so they are broad. The markup sink looks up the exact string
`html`, so it is narrow. A broad guard in front of a narrow sink leaves no gap:
keys like `HTML`, or `html` followed by a zero-width space, pass every guard
untouched and then never matter, because nothing ever asks for them.
`setContents` in `cloudcanvas-lib/plugins/widget.js` merges keys verbatim and performs no
trimming or case folding, and the card renders markup only for the exact key
`html`. Adding key normalization there would look like tidying and would make
`" html "` live again. cloudcanvas-lib's `tests/unit/addons-types.test.js` holds this.

**INV-2: `restoreTree` must stay self-contained.**
`cloudcanvas-lib/sandbox/export-static.js` embeds that function's source text into every
exported site. It must have no imports and no module-scope references, or an
exported page throws. The reserved key literals are inlined there for this
reason, with a unit test asserting the inlined literals still equal the exported
engine constants.

**INV-3: `normalizeCustomType` is the only way a stored custom type is read.**
No raw read of a `cloudcanvas-custom-type:` storage key exists anywhere in `cloudcanvas-lib`
or `cloudcanvas-site`. Adding one would bypass the loader defence.

**INV-4: the type marker is stamped last.**
`placeCustomType` writes `TYPE_NAME_KEY` after the user's fields, so a colliding
user field cannot shadow the marker.

## Accepted residual risk

The restore defence keys on the `cc:typeName` marker, so it neutralises poisoned
custom type instances. A hand-crafted board carrying a bare `card` node with
an `html` content key and no marker would still render as markup.

This is not reachable from the product today. No session or project import
exists anywhere in the app. ZIP is export only, with no unzip path. The only
file drop is filtered to images. Every `deserializeBoard` caller is internal:
the app's own storage and the in-memory undo stack. Exploiting it would require
already holding script execution or direct storage write on the origin, which is
strictly more than the bug would grant.

Re-evaluate this the moment a session, project, or template file import is
added.

## Probes run

Against VULN-001, after the fix:

- Nineteen spellings of the field key, driven through all three layers:
  `html`, `HTML`, `" html "`, `html` plus a zero-width space, `html` plus tab
  and newline, non-breaking spaces around `html`, `__proto__`, the numeric
  string `'0'`, a non-string key, `constructor`, and the reserved set
  `cc:typeName`, `cc:future`, `cc:` alone, `" cc:x "`, alongside the
  deliberately unreserved `CC:`, `Cc:`, `ccx`, `cc` and `ccc:x`.
  No spelling reached the markup sink. Case sensitivity is deliberate and
  preserved.
- Mutation probes on each defence. Disabling the loader rule, the `cc:` rule,
  the gate, or the restore strip each caused failing tests, confirming the tests
  exercise the defences rather than merely accompanying them.
- Self-containment of `restoreTree`, proven by compiling its stringified source
  and running it inside an empty context. It executed, produced the expected
  warning, and referenced nothing from its original module.
- Slotted types, confirmed to render through `setText` only, with `cc-slotted`
  absent from the markup-capable display types.

Against the static servers (`scripts/dev-server.js` and the browser test
harness, both on `scripts/served-path.js`), in `tests/integration/dev-server.test.js`
(cloudcanvas-site's since 0.7.0; the served segments below are the 0.6 workspace's):

- Hidden components. Exactly `.plugin`, `.addons` and `.site` are served, and
  only as the first path segment. `/.git/config`, `/.env`, `/.gitmodules`, the
  nested `/.plugin/.git`, the encoded `/%2egit/config` and the collapsed
  `/.site/../.git/config` are all refused.
- Traversal, `node_modules`, and a symlink - file or directory - whose real path
  leaves the root.
- The CORS wildcard is absent unless the server is started with `--cors` (0.5.0; it used to follow a `0.0.0.0` bind).

## Not yet probed

Named so that this file is honest about its own coverage:

- Path handling in the ZIP writer on export.
- Catalogue fetch origin and response validation beyond field keys.
- Storage JSON parsed without schema validation, in `persistence.js` and
  `custom-types.js`.
- HTML and attribute escaping in the static export path.

## Open defects

- `cloudcanvas-site/custom-types.js` derives the reserved prefix from
  `TYPE_NAME_KEY`. If that constant ever lost its colon the derivation yields an
  empty string, and every field of every custom type would be dropped silently
  at load. A unit test fixes the value, so the change would be caught, but the
  code carries no guard.
- ~~No test holds INV-1.~~ Held since 0.5.0: a card given `" html "` renders it as
  nothing, and only the exact key `html` reaches markup.

## Markup sinks (0.5.0)

The 0.4 engine and its `DisplayTrait` are gone. Every place shipped code assigns
markup, and what can reach it:

| Sink | Fed by | Guard |
|---|---|---|
| `core/type.js` - a type's `<template>` parsed from `html` | `type(name, {html})`, `widget({html})` | Author code only: type markup is structure, never data. No product path builds a type from user text (`cloudcanvas-site/slotted-type.js` builds its templates with DOM calls). |
| `core/blit.js` - `fill` into a `[data-slot-html]` slot | `b.set({fill})` | Only a slot the *template* marks `data-slot-html`; every other slot takes text. Spec data cannot mark a slot. |
| `cloudcanvas-lib/plugins/widget.js` `setSlot` - a card's `html` key, a `raw` blit's `html` | widget contents (`card`, `raw`) | The exact key `html` only (INV-1); the restore strip and the builder's gate keep it off custom-type instances (VULN-001). |
| `cloudcanvas-lib/plugins/widget.js` `setSlot` - badge, needle and meter SVG | `graphics/primitives/primitives.js` | Numbers through `safeNumber`, colours through `safeColor`, badge text escaped. |
| `cloudcanvas-lib/plugins/cursors.js` - the focus frustum | primitives, from blit bounds | Numbers only. |

**Markup is a sink through `data-*` too.** A widget's contents live in its `data-<type>` attribute, so HTML
like `<div data-blit data-type="card" data-card='{"html":"..."}'>` inside a board root renders its `html`
when the root adopts it (and `cloudcanvas-lib/observe` adopts markup inserted later). Author markup is trusted;
never insert untrusted HTML into a board root, and do not rely on a sanitizer that keeps `data-*` attributes
(DOMPurify's default does).

Since 0.5.0 the loader drops a widget's content key given as a top-level node key (contents load only through
`fill`, where the reserved-key strip runs), and reactions refuse to write `html`, prototype keys or `cc:`
keys (`cloudcanvas-lib/plugins/actions.js`), closing two ways around the VULN-001 strip found in the 0.5.0 review.

URLs (`src`, `href`, `url`, `poster`) go through `safeUrl`, which refuses
`javascript:` and `data:text/html`; the loader refuses them on restore as well. The
toast of the `notify` reaction writes its message as text.

## GPU drawing (0.6.0)

`cloudcanvas-lib/gpu` adds no markup sink: it draws from numbers (boxes, `z`, rotation), a tint and textures.

- **Tint.** `data-tint` is read as hex only (`#rgb`, `#rrggbb`, `#rrggbbaa`); anything else draws white.
  It never reaches CSS or markup.
- **Textures.** A texture is any image, canvas, video or ImageBitmap handed to `gpuContent`. The browser
  refuses to upload a cross-origin source without CORS (a tainted canvas or image). Both backends catch that
  refusal and log it; the texture keeps what it had (white when new), and the frame and the root's loop go on
  (`gpu.js` also catches any backend error per frame). Nothing is read back except by `snapshot()`, which reads
  only the canvas this root drew.
- **Proxies.** A gpu blit's element stays in the DOM at `opacity: 0`, so it remains an event and
  accessibility target exactly like any blit; no new input path.
- **Backends.** Loaded by `import()` from the package's own files only; a custom backend is a function the
  author passes, never a name from data.

## Content add-ons (0.6.0)

| Add-on | Input | Guard |
|---|---|---|
| `xml` | an XML document | Parsed by `DOMParser` as XML (never HTML); no parsed node enters the document. Tags must be registered types (`types` narrows further), attributes are spec keys (`keys` narrows; `type`, `fill`, `with` and prototype names refused), text reaches slots as text - an html slot takes nothing unless `{html: true}`. The whole document is read and checked (`limit` on elements, `MAX_DEPTH` on nesting, placement numbers) before anything is built. |
| `sprites` | a sheet `src` | `safeUrl` (http(s), relative, `data:image/*` only); written into CSS as a quoted `url("...")` with `"`, `\` and line breaks escaped; loaded CORS-anonymous. |
| `text` | a string | Rastered by Canvas2D and written to the element with `textContent`; colours through `safeColor`. |
| `video` | a `src` | `safeUrl`; an unsafe one is not loaded. CORS-anonymous: a cross-origin video without CORS plays in the DOM but never reaches the GPU. |
| `own-canvas` | an author function | Author code only; a throwing draw is caught and logged. |
| `mesh` | a shape name | One of three built-in geometries; an unknown name draws a box. |
| `html-canvas` | the blit's own DOM | No new input: the author's nodes move into a `<canvas layoutsubtree>` in the same document (still laid out, focusable and accessible) and move back on `off()`; capture is the browser's own `drawElementImage`. |
| `svg-path` | path data | Parsed as numbers and commands only (malformed data throws with its offset); `PATH_LIMIT` characters and `POINT_LIMIT` points cap the work, every triangulation loop is bounded, and coordinates must fit a float. The inline `<svg>` fallback is built with `createElementNS`/`setAttribute`; `d` is data, colours go through `safeColor`. |

An XML attribute naming a registered trait starts that trait with the decoded options, exactly as a saved board
or `data-*` markup would: load XML only from sources you would load a board from, or pass `keys`.

**Ports and traits share one namespace** (`blit.use`). Anything that sets `port` by name can therefore choose a
trait's function as a port. XML takes a `port` only from its `ports` allowlist (none by default), and since
0.6.0 a port that throws is dropped for the default port (`core/frame.js`), so a wrong one cannot stop a root's
loop. The board loader still accepts any registered name as `port` (a known LOW, open): a separate registry for
ports would close it, at the cost of a change to `blit.use`.

## Repository split (0.7.0)

The workspace's single dev server became three servers, each with its own tests:
`cloudcanvas-site/scripts/dev-server.js`, the mcp hub's `/vendor/<package>/` route, and the
browser-test harnesses in `cloudcanvas` and `cloudcanvas-lib`. Reviewed adversarially on 2026-11-14;
no critical or high finding. Fixed and held by tests:

- Site dev server: the dot-segment, closed-`node_modules` and allow-list rules are re-applied to the
  real path after symlinks resolve (a tracked `leak.js -> .git/config` was served before); an
  unreadable or vanished file is a 500, not a crashed process; a `Host` header that is not loopback,
  the bound host or the arrival address gets 421.
- mcp hub: `/vendor/cloudcanvas/` and `/vendor/cloudcanvas-lib/` serve only `.js`/`.css` package
  files whose real path stays inside the package, never dotfiles, nested `node_modules`, tests or
  `testing` modules; the import map is injected into `web/index.html` under a CSP `sha256-` hash
  whatever spelling requests the page; `web/` refuses dot segments and symlinks out.
- Harnesses: streams fail as 500, and lib's harness refuses a served package's directory itself.
- Packages: `cloudcanvas` modules import only files the package ships and have no load-time effect;
  `cloudcanvas-lib` reaches the core only through its published entries, and its `dist/` carries no
  second copy of the core outside the self-contained board runtime.

Accepted: the test seams `cloudcanvas/testing`, `cloudcanvas-lib/ui/testing` and
`cloudcanvas-lib/sandbox/testing` are published entries; nothing in them is needed at runtime and
no page imports them. The npm names `cloudcanvas` and `cloudcanvas-lib` are not yet registered; until
they are, a consumer installing `cloudcanvas-lib` alone could resolve its `cloudcanvas` peer to a
package someone else publishes under that name.
