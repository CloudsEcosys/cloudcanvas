<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# The panel add-on

Asked for by Richard on 2026-11-11, from the M3 dashboard (`~/.ln/.internal/modules/m3`): fixed side
regions should be one reusable thing that can float, attach to an edge, open as a modal, fill the host,
move to its own window, fold away, and share a frame as tabs, behind a small configurable set of
controls. Clean and efficient in the implementation.

Branch `sprint/panel-addon` in this repository and in `.plugin`. Nothing is committed or pushed until
Richard says. **Open, his to decide:** where this sits in the numbered phases, and the version it ships in.
Until then the CHANGELOG entry goes under "Unreleased" and `package.json` keeps 0.6.0.

## 1. The model

**The layer.** `panels(host)` gives a host element one layer: a child marked `data-cc-panels`, mounted
as a root of its own with no pan, covering the host and letting presses through. Panels are that root's
blits, so the canvas camera of any board underneath never moves them. The host must be a positioned
element that is not inside a CloudCanvas root and is not one; otherwise `panels` throws a `TypeError`
that names the repair (wrap the board's host and pass the wrapper). A second call on the same host
returns the same layer. An existing `[data-cc-panels]` child is adopted, with the `[data-blit][data-panel]`
elements already in it.

**The panel.** A blit on the layer that carries the `panel` trait. The blit's element is a frame the
add-on owns: a bar first, then a body. The author's content lives in the body and is never rewritten,
so content that replaces its own children keeps working.

**Three settings say where a panel is.** They are data and round-trip through `data-panel`.

| Key | Values | Default | Meaning |
|---|---|---|---|
| `at` | `float` `left` `right` `top` `bottom` `modal` `full` `window` | `float` | the place |
| `pinned` | boolean | `true` | on an edge: `true` takes its own space, `false` lies over the content as a drawer |
| `collapsed` | boolean | `false` | folded: on an edge to its tab, floating to its bar; no effect on `modal`, `full`, `window` |

The rest of the options:

| Key | Type | Default | Meaning |
|---|---|---|---|
| `open` | boolean | `true` | `false`: not shown; its settings are kept |
| `size` | number, or `{x, y}` | `360` | thickness on an edge, in px: `x` on the left and right, `y` on the top and bottom. A number is both. Sizing on an edge changes only that axis |
| `box` | `{x, y, w, h}` | centred, 480 by 360 | the floating box; `modal` uses its `w` and `h` |
| `title` | string | `''` | the bar's title and the tab's label; falls back to `titleOf(element)` |
| `places` | list of `at` values | all but `window` | where a person may put it; controls and snapping obey it |
| `controls` | list of names | `collapse` `pin` `place` `full` `close` | the bar's buttons, in this order; `[]` shows none |
| `snap` | number | `24` | px from an edge at which a drag attaches; `0` turns snapping off |
| `min` | `{w, h}` | `{w: 200, h: 120}` | the smallest box and edge thickness |
| `group` | string | `''` | floating panels with the same group share one frame as tabs |
| `active` | boolean | derived | among panels sharing a place, the one shown |

An unknown `at`, control or place throws a `TypeError` naming the allowed values. Numbers that are not
finite throw, and so does a flag that is not a boolean or a `title` or `group` that is not a string.
Unknown keys are kept and ignored.

**The slot.** `slotOf(options, id)` names the place a panel occupies: the `at` itself for an edge,
`modal` and `full`; `float:<group or id>` and `window:<group or id>` otherwise. Open panels in one slot
are tabs of one frame: one is active and shown, the others are not displayed. When no member says
`active`, the first in document order is. A panel put into an occupied slot becomes the active one and
takes the slot's `size`, `pinned`, `collapsed` (edges) or `box` (floating) from the member that was
active; switching tabs carries them the same way.

**Placement.** `placeOf(options, layerSize, insets)` is pure and returns `{x, y, w, h}` in layer px:

- `float`: `box`, at least `min` and no larger than the layer, moved so the whole bar stays inside the
  layer. The stored `box` keeps what the person set, so a layer that grows gives it back.
- An edge: a strip of thickness `t`, where `t` is 28 (the tab) when collapsed, else `size` held between
  `min` and the layer's extent less 80; where those cross, `min` wins. A pinned left or right strip
  runs the full height, and a pinned top or bottom strip runs between the pinned left and right strips.
  A drawer (unpinned) lies over the content only: it runs between the pinned strips on the two edges it
  meets, so it never covers another panel's bar. Opposite pinned strips together leave the content at
  least 80: when they would not, each is reduced in proportion, not below `min`, and where even the
  minimums do not fit, `min` wins.
- `modal`: `box.w` by `box.h`, each at most the layer less 48, centred.
- `full`: the layer.
- `window`: none; the frame is in its own window.

**Insets.** `insetsOf(panels, layerSize?)` is pure: per edge, the thickness taken by open, pinned panels
there (28 when collapsed), clamped as placement clamps it when `layerSize` `{w, h}` is given. After any
change the layer writes `--cc-panels-top`, `-right`, `-bottom`, `-left` on the host, in one write pass
and only the variables whose value changed, and emits `panels:inset` `{top, right, bottom, left}` on the
host. Content that should make room reads those variables. Drawers, floating panels,
modals and full panels take no space.

## 2. What a person can do

**The bar** holds the tab strip (a single panel shows its title) and the buttons named in `controls`:

| Control | Does | Shown |
|---|---|---|
| `collapse` | toggles `collapsed` | on an edge, and floating |
| `pin` | toggles `pinned` | on an edge |
| `place` | a menu of the allowed `places`; choosing one sets `at` | when more than one place is allowed |
| `full` | `at: 'full'`, and back to the place it came from | when `full` is allowed |
| `close` | emits `dismiss`; unless prevented, sets `open: false` | always |

Every control is a real `button`. A toggle keeps one accessible name that says what it is for and shows
its state through `aria-pressed`; the name does not change with the state. The pressed state is shown
by more than colour. The place menu is a `menu` of `menuitemradio`s, roved with the
arrows, closed with Escape. A collapsed edge panel shows only its tab, the title turned along the edge;
pressing it expands the panel.

**With the pointer**

- Dragging the bar (not a button on it) moves a floating panel. It reuses the drag add-on's gesture
  functions and announces `drag:start` and `drag:end` as drag does.
- Dragging the bar of a panel that is on an edge, modal or full, past the threshold, makes it float
  under the pointer with its floating box's size, when `float` is allowed.
- While a drag is within `snap` px of a layer edge whose place is allowed, one preview element shows the
  strip the panel would take: the slot's own size where that edge already holds a panel. Releasing
  there attaches it; `pinned` is left as it was.
- A double press on the bar toggles full, when `full` is allowed.
- Sizing uses the resize add-on: all eight handles when floating, the inner side only on an edge, none
  when collapsed, modal or full. `resize:end` stores the new `box` or `size`. A text selection inside the
  panel never turns a press on a handle or the bar into the browser's own drag.

**With the keyboard**

- The bar is one tab stop. On it: the arrows move a floating panel 16 px, and Shift with the arrows
  sizes it 16 px (the box when floating, the thickness on an edge). Enter or Space on a collapsed tab
  expands it.
- A modal holds the keyboard: Tab cycles inside it, Escape closes it as the close control does, and on
  closing the focus returns to the element that had it before, when that element is still in the
  document and shown; an element inside the panel counts when the panel is still shown. Otherwise the
  add-on leaves the focus alone and the application, which hears `panel:change`, decides. It also takes
  every press outside itself: the layer is dimmed and the content beneath cannot be used until the modal
  closes. A press outside does not close it. The frame is a `dialog` with `aria-modal`.
- While a panel is modal or full, the other panels on the layer are `inert`: they are covered, so the
  keyboard does not reach them.
- The tab strip is a `tablist`: Left and Right move among the tabs and select. A tab is an element with
  the `tab` role and not a button, so a bar that is all tabs can still be dragged; a press that does
  not move selects the tab. The `tablist` is named for its place, each tab controls the body it shows,
  and that body is its `tabpanel`. A strip with more tabs than fit scrolls sideways and keeps the
  selected tab in view; a tab is never narrower than its first eight characters.

**In its own window.** `at: 'window'` shows the frame, bar included, in a browser window of its own with
the document's stylesheets copied into it (no scripts). Closing that window, or setting `at` to anything
else, brings the frame back to the place it came from. When the window cannot be opened the place does
not change and the panel emits `panel:refused` `{at: 'window', reason}`. A panel whose place is already
`window` and that is opened when no window can be had goes back to the place it came from, so an open
panel is never left unseen. The window is opened at once,
inside the gesture that asked for it, because a browser allows that only there; everything else the
window does is in a module loaded on demand the first time a panel goes to a window. In a window the bar
shows only the place and close controls, and it does not drag. The close control there closes the panel
and puts it back at the place it came from. The window takes the floating box's size; its position and
later size are not remembered. Stylesheets added to the page after the window opened are not copied. Content that listens on the opener's `window`
or `document` will not hear the other window; `panel:change` carries `window` (the window object, or
null) so an application can attach what it needs.

## 3. Interfaces

```js
import { blit } from 'cloudcanvas';
import { panels, panel, panelOf, setPanel, placeOf, slotOf, insetsOf, bodyOf } from 'cloudcanvas/panel';

blit.use({ panel });                         // cloudcanvas/defaults names it too

const layer = panels(document.querySelector('#shell'));
const sheet = layer.add(document.querySelector('#sheet'), { id: 'sheet', at: 'right', title: 'Sheet' });

setPanel(sheet, { at: 'float' });            // merge a patch into its options
panelOf(sheet);                              // its options, whole and normalised
bodyOf(sheet);                               // the body element holding the content

layer.snapshot();                            // { sheet: {...}, try: {...} }: plain data
layer.apply({ sheet: { at: 'full' } });      // patches by id; unknown ids are ignored
layer.list();                                // the panels' blits, in document order
layer.insets;                                // { top, right, bottom, left }
layer.off();                                 // content goes back where it came from; the layer is removed
```

| Name | Shape |
|---|---|
| `panels(host)` | `→ { el, root, add, list, snapshot, apply, insets, off }` |
| `layer.add(content, options)` | `content`: an element (moved into a new frame's body) or nothing (an empty panel). `options`: the table above plus `id`. `→` the frame's blit |
| `panel` | the trait, `(b, options, root) => cleanup` |
| `panelOf(b)` | `→` the normalised options |
| `setPanel(b, patch)` | merges and writes; `→` the options in force |
| `bodyOf(b)` | `→` the body element |
| `placeOf`, `slotOf`, `insetsOf` | pure, as in section 1. A missing layer size, or one that is not finite, throws a `TypeError` that names it |
| `PANEL_PLACES`, `PANEL_EDGES`, `PANEL_CONTROLS`, `PANEL_TAB_PX` | frozen constants |

Markup alone declares a panel: `<section data-blit data-panel='{"at":"right","title":"Sheet"}'>` inside
the layer element. Its children become the body.

| Event | On | Payload |
|---|---|---|
| `panel:change` | the panel | `{at, pinned, collapsed, open, active, from, window}` after any of them changed |
| `panel:refused` | the panel | `{at, reason}` |
| `dismiss` (cancelable) | the panel | before the close control or Escape closes it |
| `panels:inset` | the host | `{top, right, bottom, left}` |
| `drag:start`, `drag:end`, `resize:start`, `resize:end` | the panel | as drag and resize announce them |

A write of the options must not rebuild what did not change (the bar stays when its controls and tabs
are the same), must not move the focus, and must not interrupt a gesture in flight.

`panel:change` and `panel:refused` arrive at the end of the task, one per panel per task, with `from`
the place the panel had when it last announced. Removing the trait takes effect at the end of the task
too.

## 4. Rules for the implementation

- The add-on contract in `ARCHITECTURE.md` holds: pure on import, one subpath (`cloudcanvas/panel`),
  traits as `(b, options, root) => cleanup`, frame work through `b.tick` or `root.hooks` with reads
  before writes, CSS as one chunk under `.plugin/graphics/css/` injected once, every colour and metric a
  `--cc-panel-*` token with a fallback, announcements through `b.emit`.
- Reuse, do not copy: the drag add-on's `pressDrag`, `moveDrag`, `releaseDrag`, `endDrag`; the resize
  add-on as a trait the panel sets; `titleOf`, `listen`, `injectAddonCss`, `isControlTarget` from the
  trait kit; `park.js` for a frame that leaves the document.
- Idle costs nothing: no pass runs unless a panel changed, a gesture is in flight or the host was
  resized (one `ResizeObserver` per layer).
- Movement between places is a CSS transition, off during a gesture and under
  `prefers-reduced-motion: reduce`.
- Text reaches the DOM as text. No new markup sink; `SECURITY.md` stays true.
- The core and the existing add-ons do not change, apart from an export the panel needs and cannot get
  otherwise; say so in the report if one was needed. `cloudcanvas/defaults` names every add-on, so its
  size row grows by the panel; no other existing row grows.
- At most 500 lines a file, 50 a function, three levels of nesting. Split by concern: the trait, state
  and placement; the bar, controls and tabs; snapping; the modal; the window (on demand).
- Every file carries the repository's header and says in it what the file is for.

## 5. Tests and documents

- Unit: `placeOf`, `slotOf`, `insetsOf` and the normalisation, over every place, the clamps and the
  refusals.
- Unit or integration on the repository's DOM setup: options round-trip through `b.spec`; each control;
  tabs joining and switching; the events and a prevented `dismiss`; insets written once per change;
  `off()` returning content to where it was; the idle frame writing nothing.
- Browser (`tests/browser/`, with a fixture page): drag, snap to each edge and away, resize in each
  place, collapse, pin, full and back, modal focus and Escape, tabs, the window and its return, a host
  resize, reduced motion.
- All of these stay green: `npm test`, `npm run test:browser`, `npm run check:dist`,
  `npm run size:check`, `node scripts/tree.js --check`.
- Documents: `package.json` export, `defaults.js`, the README's add-on list, a GUIDE section, the event
  rows and the regenerated tree in `ARCHITECTURE.md`, `CHANGELOG.md` and `.plugin/CHANGELOG.md` under
  Unreleased, a size row, `dist/` rebuilt.

**Open, Richard's to decide, found at the first checkpoint (2026-11-11):**

- The vocabulary gate (`scripts/vocab.js`) bans the bare word `pin`. The control and the setting are
  named `pin` and `pinned`, his own words, so the panel's files are exempted in that gate. The other way
  is to rename them.
- `cloudcanvas/defaults` grew from 37.0 to 43.3 KB gzipped by naming the panel. The other way is to
  leave the panel out of the defaults.

## 6. Order of work

1. **The add-on without the window**: the trait, placement, insets, the bar and controls, tabs, snapping,
   the modal, CSS, tests, documents, `dist/`. Checkpoint: the suites pass and the fixture page is seen
   working.
2. In parallel: **the window** here, and **M3 taking the add-on up** in its own module.
3. One consolidated QA over both: behaviour against this file, security, efficiency, code quality.
   Corrections go to whoever owns the file; QA checks them again.

## 7. Not included

- Dragging a tab out of a frame, or dropping a panel on another to join its tabs. The place menu and
  `group` cover both.
- A drawer that folds by itself when the pointer leaves.
- Application buttons in the bar.
- Saving the layout anywhere: `snapshot()` is plain data and the application keeps it.

## 8. QA, 2026-11-11

One consolidated pass by an agent that built none of it. Report:
`~/.ln/.internal/modules/m3/.context/logs/reports/2026-11-11-panels-qa/report.md`. No blocker and no
high finding. For the add-on:

| Finding | Decision |
|---|---|
| A-1 a sizing gesture ends after its first move when text inside the panel is selected | fix |
| A-2 the snap preview shows the wrong strip on an edge that already holds a panel | fix |
| A-3 a floating box larger than the layer puts the bar's controls out of reach | fix: placement clamps the box to the layer |
| A-4 focus is lost after a modal opened from inside the panel | fix, by the rule now in section 2 |
| A-5 toggle names do not change with state | kept: one name with `aria-pressed` is the pattern; section 2 reworded |
| A-6 Tab walks from a full panel into the panels it covers | fix: covered panels are inert |
| A-7 an opened panel at `window` with no window is left unseen | fix |
| A-8 many tabs become unreadable | fix: the strip scrolls |
| A-9 `placeOf` without a layer size throws an unnamed error | fix |
| M-3 one thickness for both axes; opposite pinned strips can take the whole layer | fix: `size` per axis, and the 80 rule for opposite strips |
| The `tablist` has no name and no `tabpanel` | fix |

## 9. Brought current with main, 2026-11-14

The branch was cut from `f01431e`, 69 commits behind `origin/main` (`baac086`, the UI kit consolidation
recorded in `PLAN.md`). `origin/main` and `mindfull-staging-readiness-20261101` (the drawer's
`collapseDirection: 'up'`) are now merged into `sprint/panel-addon`, in `.plugin` and here. The plane
change of 2026-11-12 (`core/root.js`, `core/css.js`: one composited layer only while the camera moves)
was committed first and is under Unreleased in both changelogs. Nothing is pushed.

| Check | Result |
|---|---|
| `.plugin` merge | No conflict. |
| Parent merge | Conflicts in generated files only: the `.plugin` pin, `dist/` and `scripts/size-baseline.json`. All three regenerated (`npm run build`, `size.js --update`). |
| Section 5 gates | `npm test` 1,764 pass; `npm run test:browser` 367 pass; `check:dist`, `size:check`, `tree.js --check` and `vocab.js` pass. `axe-core`, a dev dependency main added, was not installed in this checkout and had to be. |
| Size rows above both sides | Two, each the sum of both sides' changes: `minimal+menu` 32,556 / 12,024 gzip (main 32,269 / 11,937) and `defaults` 131,651 / 45,046 (this branch 131,641 / 45,038). |
| The panel beside `cloudcanvas/ui` | They share theme tokens only: no class, attribute or `--cc-panel-*` token in common, and neither imports the other. The panel's drawer place and the kit's drawer control are separate. |

Open: the two decisions in section 5 still stand; publication (push, pull request, target branch) is
Richard's to approve.
