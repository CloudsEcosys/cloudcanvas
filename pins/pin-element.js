/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pin element: everything a Pin does to its backing DOM node.
 *
 * Three concerns, all of them mechanical:
 *
 *   - structure  : the fixed `.cloudcanvas-pin > content + scope` two-child shape,
 *   - measurement: layout-space reads and the cached scope offset they feed.
 *
 * DOM membership (mount / park / detach) lives in `./pin-membership.js`, and the
 * hierarchy those moves imply is read back from the DOM by `./pin-hierarchy.js`.
 *
 * Every function takes the Pin as its first argument. `Pin` keeps thin methods
 * that forward here, so the class stays the model and this stays the mechanics.
 * Nothing here decides *whether* a Pin should be mounted - that is reload policy
 * (`./reload.js`) - and nothing here runs a trait hook.
 */
import { stateOf } from '../core/state.js';
import { MAX_DEPTH } from '../engine/mounting.js';
import { formatTransform3D } from '../graphics/styles.js';
import { CLS } from './traits/display-templates.js';
import { registerElement } from './pin-hierarchy.js';

/** Class every Pin's root element carries; the engine's only structural hook. */
export const PIN_CLASS = 'cloudcanvas-pin';

/**
 * Default presentation: the card surface, padding, border, radius and shadow.
 *
 * `chrome` is exactly the presence of this one class on the root element - there
 * is no wrapping card *element*, the fixed `.content + .scope` structure is built
 * either way (see {@link buildElementStructure}). So `chrome` is structurally the
 * twin of {@link BORDERLESS_CLASS}: a single class the Pin holds a flag for and
 * mirrors onto its root, and {@link setChrome} is its live accessor.
 */
export const CARD_CLASS = 'cloudcanvas-primitive-card';

/** Class of the display-only child node; every display trait writes here. */
export const CONTENT_CLASS = 'cloudcanvas-pin-content';

/** Class of the child-Pin container; never rewritten by display rendering. */
export const SCOPE_CLASS = 'cloudcanvas-pin-scope';

/**
 * Class granting a scope container its well: the box, the border, the gap and
 * the clipping. Written only when a live child is actually inside, so an empty
 * scope - which every Pin has - takes up no space and shows nothing.
 */
export const SCOPE_POPULATED_CLASS = 'cc-populated';

/**
 * Class granting a Pin's content node real text selection (`selectableText`).
 *
 * Two halves that have to agree: the stylesheet lifts `user-select` and the
 * grab cursor inside the content node, and `../engine/pointer.js` reads the
 * same class off the document to stand the drag gesture down there. Both are
 * keyed on this one name, written once at setup.
 */
export const SELECTABLE_TEXT_CLASS = 'is-selectable-text';

/**
 * Class withholding the card's painted border (`bordered: false`) - finer than
 * `chrome: false`, which removes the whole card for a component drawing its own.
 * The stylesheet's half is `border-color: transparent`, not `border: none`, so
 * the toggle moves no geometry (`../graphics/styles-css.js`).
 */
export const BORDERLESS_CLASS = 'is-borderless';

/**
 * How a Pin arranges its CHILDREN. `free` is today's behaviour - every child
 * absolutely positioned by its own transform - and is the default; the other
 * three lay the scope well out with flex or grid so the children flow.
 */
export const LAYOUT_MODES = /* @__PURE__ */ Object.freeze({
  FREE: 'free',
  ROW: 'row',
  COLUMN: 'column',
  GRID: 'grid'
});

const LAYOUT_VALUES = /* @__PURE__ */ new Set(/* @__PURE__ */ Object.values(LAYOUT_MODES));

/**
 * The scope-element class each non-`free` layout mode is expressed by. Layout is
 * a property of how a Pin arranges its children, so the class lives on the well
 * that holds them (`SCOPE_CLASS`), never on the Pin's own root.
 */
export const LAYOUT_CLASS = /* @__PURE__ */ Object.freeze({
  row: 'is-layout-row',
  column: 'is-layout-column',
  grid: 'is-layout-grid'
});

/**
 * Class a child carries while its parent lays it out in flow (any non-`free`
 * layout). Its half of the contract is `position: relative` - the child drops out
 * of absolute positioning and the renderer stops writing it a transform.
 */
export const FLOW_CHILD_CLASS = 'is-flow-child';

/** Custom property the `gap` option is written to; read by all three flow modes. */
export const LAYOUT_GAP_PROPERTY = '--cc-layout-gap';

/**
 * The platform controls a press on a Pin stands down for - the router declines
 * to capture the stream, and a drag refuses to start - and the attribute that
 * declares a custom widget one. One list, owned by the trait kit.
 */
export { CONTROL_ATTR, CONTROL_SELECTOR, isControlTarget } from '../addons/trait.js';

/** Shared zero offset for Pins that were never measured. */
const ORIGIN = /* @__PURE__ */ Object.freeze({ x: 0, y: 0 });

/**
 * A Pin's static ARIA identity.
 *
 * `group` rather than `article` or `button`: a Pin is a container of related
 * content whose interaction is supplied by its traits, and claiming a role it
 * does not implement is worse than claiming a generic one. The role description
 * is what makes a screen reader say "pin" instead of "group".
 */
const PIN_ARIA = /* @__PURE__ */ Object.freeze({
  role: 'group',
  'aria-roledescription': 'pin'
});

/* ------------------ STRUCTURE ------------------ */

/**
 * Build the Pin's backing <div>. Every Pin has one - its core record holds the
 * placement (`../core/state.js`) - so a missing document throws. A utility Pin
 * gets a detached, hidden node that nothing mounts, queries or renders.
 */
export function createDefaultElement(pin, options = {}) {
  if (typeof document === 'undefined') {
    throw new TypeError('Pin: a document is required; headless construction is not supported');
  }
  const div = document.createElement('div');
  div.id = pin.id;
  div.className = rootClassName(options);
  if (pin.utility) {
    div.hidden = true;
    return div;
  }

  if (options.width !== undefined) {
    div.style.width = `${options.width}px`;
    // An explicit width is a decision already made; the card's readable-measure
    // clamp (`--cc-card-max-width`) must not silently override it.
    div.style.maxWidth = 'none';
  }
  if (options.height !== undefined) div.style.height = `${options.height}px`;

  return div;
}

/**
 * The root element's class list: structure first, presentation only by consent.
 *
 * `PIN_CLASS` is never optional - it is what the plane, the renderer, and the
 * pointer router recognise a Pin by. Everything after it is presentation, and
 * the caller's decision always wins:
 *
 *   - `chrome: false` (or the equivalent explicit `className: ''`) asks for a
 *     bare Pin: a positioned box with a content node and a scope well, and no
 *     surface, padding, border, or shadow at all. That is what a component that
 *     draws its own chrome needs, and painting over the default card first is
 *     both a wasted frame and a fight the component has to win in CSS.
 *   - a `className` replaces the default card with the caller's own, as it
 *     always has.
 *   - neither leaves the default card in place.
 */
function rootClassName(options) {
  if (options.className) return `${PIN_CLASS} ${options.className}`;
  const chromeless = options.chrome === false || options.className === '';
  return chromeless ? PIN_CLASS : `${PIN_CLASS} ${CARD_CLASS}`;
}

/**
 * Tag the element with its Pin identity, build the child structure, measure once.
 *
 * `PIN_CLASS` is written here, not only in `createDefaultElement`, because an
 * adopted element (`options.element`) never passes through that builder - it
 * arrives with the caller's markup and the caller's classes. Every layer that
 * resolves a Pin from a DOM node does it by `.cloudcanvas-pin` (the pointer
 * router's `pinForEvent`, the keyboard router, the renderer's plane queries),
 * so an adopted element without the class is a Pin none of them can see: its
 * drag, its selection, and its keyboard actions silently never fire.
 *
 * Additive through `classList`, never `className`: the caller's own classes are
 * theirs to keep, and a normally-constructed Pin already carries the class, so
 * the write is idempotent for every Pin.
 */
export function setupElement(pin) {
  if (!pin.element) return;
  registerElement(pin, pin.element);
  if (pin.element.classList) pin.element.classList.add(PIN_CLASS);
  if (pin.element.setAttribute) {
    pin.element.setAttribute('data-pin-id', pin.id);
    applyPinAria(pin.element);
  }
  if (pin.selectableText && pin.element.classList) {
    pin.element.classList.add(SELECTABLE_TEXT_CLASS);
  }
  setBordered(pin, pin.bordered);
  syncChrome(pin);
  buildElementStructure(pin);
  syncLayout(pin);
  pin.syncDimensions();
}

/**
 * Set the Pin's border state and mirror it onto the element. The Pin holds the
 * flag and the class list holds the paint, exactly as `dragging` does, and
 * `setupElement` re-applies it onto an element built after the flag.
 *
 * @returns {boolean} the border state now in force
 */
export function setBordered(pin, bordered) {
  pin._bordered = bordered !== false;
  if (pin.element && pin.element.classList) {
    pin.element.classList.toggle(BORDERLESS_CLASS, !pin._bordered);
  }
  return pin._bordered;
}

/**
 * Reconcile the chrome *flag* to the root class list at setup.
 *
 * Chrome differs from `bordered` in where the truth lives. `bordered` is decided
 * by the flag alone and written onto the element ({@link setBordered}). The card
 * class, though, is decided by {@link rootClassName} - which suppresses it not
 * only for `chrome: false` but for a caller's own `className` and for an adopted
 * element that never passed through the builder at all. So at setup the class list
 * is the authority: the flag is read back from it, never written onto it, and the
 * live {@link setChrome} setter is the only thing that toggles the class after.
 *
 * @returns {boolean} the chrome state now in force
 */
export function syncChrome(pin) {
  if (pin.element && pin.element.classList) {
    pin._chrome = pin.element.classList.contains(CARD_CLASS);
  }
  return pin._chrome !== false;
}

/**
 * Toggle the Pin's chrome live: the card class on, and a re-measure with it.
 *
 * The one difference from `bordered`, and the reason for the extra call: the
 * border toggle is `border-color: transparent`, so it moves no geometry and needs
 * no re-measure. `chrome` is a whole card - padding, a real border *width*, and a
 * shadow - so dropping or restoring it *changes the layout box*. The particle,
 * any connector anchored to this Pin's centre, and the scope well it sits in all
 * read that box, so a live change owes the renderer the same `invalidate('content')`
 * {@link resizePin} makes for a resize. It is gated on an actual change with an
 * element present, so a write of the value already in force costs nothing.
 *
 * @returns {boolean} the chrome state now in force
 */
export function setChrome(pin, chrome) {
  const next = chrome !== false;
  const changed = pin._chrome !== next;
  pin._chrome = next;

  if (pin.element && pin.element.classList) {
    pin.element.classList.toggle(CARD_CLASS, next);
    if (changed) pin.invalidate('content');
  }
  return next;
}

/* ------------------ CHILD LAYOUT (Sprint 8.2) ------------------ */

/**
 * Validate and record the Pin's child-layout mode, mirror it onto the scope
 * element, and bring every existing child into line with it.
 *
 * The twin of {@link setChrome}, over the scope element rather than the root:
 * `layout` governs how this Pin arranges *its children*, so the `is-layout-*`
 * class lives on the well that holds them, and `'free'` carries no class at all -
 * an untouched card lays its children out exactly as before. Set through the
 * setter before the element exists (construction records the flag; {@link syncLayout}
 * applies it once the well is built), so a missing scope element here is not an
 * error - it is the pre-element phase, and only the flag is written.
 *
 * A real change reflows the well and re-flags every existing child: a container
 * that switches from `free` to `row` must make each child a flow child *now*, not
 * only future ones ({@link syncFlowChild}). It re-measures through
 * `invalidate('content')` for the same reason chrome does - the children's boxes
 * move - gated on an actual change and an element being present.
 *
 * The well itself is invalidated with it. How a well is sized depends on the mode
 * (`../engine/scope-well.js`: a free well is sized from its children's extent, a
 * flow well from its own content), and the well pass only recomputes a parent one
 * of whose *children* is dirty - which a layout switch alone does not make any of
 * them. This is exactly the "changed for a reason nothing else saw" case that
 * pass's `invalidate` exists for.
 *
 * @throws {TypeError} on an unknown layout mode - a typo must never silently
 *   leave a container in free layout.
 * @returns {string} the layout mode now in force
 */
export function setLayout(pin, layout) {
  const next = normalizeLayout(layout);
  const changed = (pin._layout || LAYOUT_MODES.FREE) !== next;
  pin._layout = next;

  writeLayoutClass(pin, next);

  if (changed) {
    for (const child of pin.children) syncFlowChild(child);
    if (pin.element) pin.invalidate('content');
    if (pin._renderer && pin._renderer.scopeWells) pin._renderer.scopeWells.invalidate(pin);
  }
  return next;
}

/** A declared layout mode, or `'free'`; an unknown one throws. */
function normalizeLayout(value) {
  if (value === undefined || value === null) return LAYOUT_MODES.FREE;
  if (!LAYOUT_VALUES.has(value)) {
    throw new TypeError(
      `Pin layout: unknown mode "${value}"; expected one of ${Array.from(LAYOUT_VALUES).join(', ')}`
    );
  }
  return value;
}

/** Mirror the layout mode onto the scope element: one `is-layout-*` class, or none. */
function writeLayoutClass(pin, layout) {
  const scope = pin.scopeElement;
  if (!scope || !scope.classList) return false;

  for (const cls of Object.values(LAYOUT_CLASS)) scope.classList.remove(cls);
  if (layout !== LAYOUT_MODES.FREE) scope.classList.add(LAYOUT_CLASS[layout]);
  return true;
}

/**
 * Re-apply the recorded layout mode and gap onto a scope element built after the
 * flag was set - the layout counterpart of {@link syncChrome}, called once by
 * {@link setupElement}.
 *
 * @returns {string} the layout mode now in force
 */
export function syncLayout(pin) {
  const layout = pin._layout || LAYOUT_MODES.FREE;
  writeLayoutClass(pin, layout);
  writeLayoutGap(pin, pin._layoutGap);
  return layout;
}

/**
 * Set the flow gap and write it to the `--cc-layout-gap` custom property on the
 * scope element, where all three flow modes' `gap:` reads it. A non-finite or
 * negative value clears the property back to the stylesheet default.
 *
 * @returns {number|null} the gap now in force, or null when cleared
 */
export function setLayoutGap(pin, gap) {
  // `Number(null)` is 0, not NaN, so a `null` clear has to be caught before the
  // coercion or it would set a real 0px gap instead of restoring the default.
  const value = gap === null || gap === undefined ? NaN : Number(gap);
  pin._layoutGap = Number.isFinite(value) && value >= 0 ? value : null;
  writeLayoutGap(pin, pin._layoutGap);
  return pin._layoutGap;
}

/** Write (or clear) the gap custom property on the scope element. */
function writeLayoutGap(pin, gap) {
  const scope = pin.scopeElement;
  if (!scope || !scope.style) return false;

  if (Number.isFinite(gap) && gap >= 0) {
    scope.style.setProperty(LAYOUT_GAP_PROPERTY, `${gap}px`);
  } else {
    scope.style.removeProperty(LAYOUT_GAP_PROPERTY);
  }
  return true;
}

/**
 * Bring a child's `is-flow-child` class into line with its parent's layout.
 *
 * A child is a flow child exactly while it has a parent whose layout is not
 * `'free'`: its position then comes entirely from the parent's flex/grid flow, so
 * the class drops it to `position: relative` and the renderer stops writing it a
 * transform ({@link ../engine/renderer.js#_applyPosition}). Called from every path
 * that changes a Pin's parent (`addChild`/`removeChild`, and `reparentPin` through
 * them) and from {@link setLayout} for each existing child.
 *
 * Two things happen only on a genuine transition. Entering flow clears the
 * transform already on the element: a `position: relative` box still honours a
 * transform, so a leftover one from its free days would visibly mis-place it -
 * this is not left to `position: relative` to neutralise, because it does not.
 * And the renderer's applied-position cache is reset either way, so a later
 * re-entry to free layout re-writes the transform the Pin needs rather than
 * skipping it as unchanged; with no renderer that leaving-flow write is done here.
 *
 * @returns {boolean} whether the child is now a flow child
 */
export function syncFlowChild(pin) {
  if (!pin) return false;

  const parent = pin.parent;
  const isFlow = Boolean(parent && parent.layout && parent.layout !== LAYOUT_MODES.FREE);

  const classList = pin.element ? pin.element.classList : null;
  const was = classList ? classList.contains(FLOW_CHILD_CLASS) : false;
  if (classList) classList.toggle(FLOW_CHILD_CLASS, isFlow);

  if (was === isFlow) return isFlow;

  if (isFlow) {
    // A relative element still honours a transform: clear the free-days one so the
    // parent's flow alone places this child.
    if (pin.element && pin.element.style) pin.element.style.transform = '';
  } else {
    // Leaving flow: the particle x/y governs the position again immediately, so
    // the cached live origin must stop answering for `globalBoundsOf` at once -
    // a stale one would anchor connectors to where the flow used to place it.
    pin._flowOrigin = null;
  }

  if (pin._renderer && typeof pin._renderer.clearAppliedPosition === 'function') {
    pin._renderer.clearAppliedPosition(pin);
    // A Pin entering flow owes `globalBoundsOf` a real origin before anything
    // anchored to it (connectors, cursors, the focus veil) can be trusted; the
    // batched read phase is where that live position is read, so join it.
    if (isFlow && typeof pin._renderer.enqueueMeasure === 'function') {
      pin._renderer.enqueueMeasure(pin);
    }
  } else if (!isFlow) {
    // No renderer to re-write next frame: restore the absolute transform now.
    pin.renderPosition();
  }
  return isFlow;
}

/**
 * Whether an event target sits in the selectable text of a Pin.
 *
 * Three exclusions make this a usable feature rather than an undraggable card:
 *
 *   - the shell outside the content node (the card's own padding) is chrome,
 *   - the header row is the *drag handle* - a card whose only grab area was a
 *     12px padding ring would be a card nobody can move, and a title bar is the
 *     convention every windowed surface already teaches, and
 *   - a nested child Pin is its own Pin: it is reached through the parent's
 *     scope container, never its content node, so it never matches here.
 *
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
export function isTextRegionTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;

  const content = target.closest(`.${CONTENT_CLASS}`);
  if (!content) return false;
  if (target.closest(`.${CLS.HEADER}`)) return false;

  const pinElement = content.parentElement;
  return Boolean(
    pinElement
    && pinElement.classList
    && pinElement.classList.contains(SELECTABLE_TEXT_CLASS)
  );
}

/**
 * Make the element a roving focus stop and give it its ARIA identity.
 *
 * `tabindex="-1"` is the whole of the roving contract: the Pin can be focused
 * programmatically (`../engine/keyboard.js`) but never by Tab, so the host
 * stays the canvas's single tab stop no matter how many Pins exist. Author
 * values win on every attribute - a Pin that was handed an element with its own
 * role, name, or place in the tab order keeps all three.
 */
function applyPinAria(element) {
  if (typeof element.hasAttribute !== 'function') return;

  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
  for (const [name, value] of Object.entries(PIN_ARIA)) {
    if (!element.hasAttribute(name)) element.setAttribute(name, value);
  }
}

/**
 * Create the fixed two-child structure exactly once.
 *
 * A caller-supplied element keeps its markup: everything already inside it is
 * moved into the content node, so custom hosts are wrapped rather than wiped.
 *
 * @returns {Element|null} the content element (null in headless mode)
 */
export function buildElementStructure(pin) {
  if (!pin.element) return null;
  if (pin.contentElement && pin.scopeElement) return pin.contentElement;

  let content = directChildByClass(pin, CONTENT_CLASS);
  let scope = directChildByClass(pin, SCOPE_CLASS);

  if (!content) {
    content = document.createElement('div');
    content.className = CONTENT_CLASS;
  }
  if (!scope) {
    scope = document.createElement('div');
    scope.className = SCOPE_CLASS;
  }

  // Preserve any pre-existing markup by relocating it into the content node.
  for (const node of Array.from(pin.element.childNodes)) {
    if (node === content || node === scope) continue;
    content.appendChild(node);
  }

  pin.element.appendChild(content);
  pin.element.appendChild(scope);

  pin.contentElement = content;
  pin.scopeElement = scope;
  return content;
}

/** First direct child element carrying `className`, or null. */
function directChildByClass(pin, className) {
  const children = pin.element ? pin.element.children : null;
  if (!children) return null;
  for (const node of children) {
    if (node.classList && node.classList.contains(className)) return node;
  }
  return null;
}

/* ------------------ MEASUREMENT ------------------ */

/**
 * Request a layout measurement: batched into the renderer's read phase when
 * one is attached, read immediately otherwise so unattached Pins keep working.
 */
export function syncDimensions(pin) {
  if (!pin.element) return false;
  if (pin._renderer) {
    pin._renderer.enqueueMeasure(pin);
    return false;
  }
  return pin.measureLayout();
}

/**
 * Read this Pin's layout box straight from the DOM.
 *
 * `offsetWidth/offsetHeight` are layout-space values, unaffected by the plane's
 * zoom transform - unlike `getBoundingClientRect`, which reports scaled screen
 * pixels and corrupts canvas geometry at any scale != 1.
 *
 * Only ever called from the renderer's read phase (or synchronously by an
 * unattached Pin), never interleaved with writes.
 */
export function measureLayout(pin) {
  if (!pin.element) return false;

  const width = pin.element.offsetWidth;
  const height = pin.element.offsetHeight;
  if (width > 0 && height > 0) {
    pin.particle.setMeasured(width, height);
    // Only a Pin with a real layout box has a live origin to read; an unlaid-out
    // one keeps `_flowOrigin` null and falls back to its particle in `globalBoundsOf`.
    captureFlowOrigin(pin);
  }

  captureScopeOffset(pin);
  return true;
}

/** Record the scope container's layout offset on the core record, for `getGlobalBounds`. */
export function captureScopeOffset(pin) {
  if (!pin.scopeElement) return;
  const state = stateOf(pin.element);
  state.sx = Number(pin.scopeElement.offsetLeft) || 0;
  state.sy = Number(pin.scopeElement.offsetTop) || 0;
}

/**
 * Cache a flow child's live layout origin for `getGlobalBounds`.
 *
 * A flow child (`pin.parent.layout !== 'free'`) is placed by the browser's
 * flex/grid engine, so its particle x/y no longer describes where it renders. Its
 * real position within the parent's scope is its own `offsetLeft/offsetTop`, read
 * here - in the renderer's batched read phase (`measureLayout`'s only caller under
 * a renderer) - so no consumer ever reads live layout on demand. That is what
 * keeps the fix inside Phase 8's read/write split: the live geometry a flow child
 * needs is captured once per frame with every other measurement, never mid-write
 * (`../engine/renderer.js`).
 *
 * The scope container is `position: relative`, so it is a flow child's
 * `offsetParent`, and it carries no border or padding (an outline stands in for
 * the border, and there is no padding) - so `offsetLeft/offsetTop` are measured
 * from the same scope-content origin a free child's particle x/y uses. That shared
 * origin is precisely what lets `globalBoundsOf` swap one for the other.
 *
 * A transform-placed Pin (every free child, every root) clears the cache back to
 * null, so `globalBoundsOf` reads its particle.
 */
export function captureFlowOrigin(pin) {
  const parent = pin.parent;
  const isFlow = Boolean(parent && parent.layout && parent.layout !== LAYOUT_MODES.FREE);
  if (!isFlow) {
    pin._flowOrigin = null;
    return;
  }
  if (!pin._flowOrigin) pin._flowOrigin = { x: 0, y: 0 };
  pin._flowOrigin.x = Number(pin.element.offsetLeft) || 0;
  pin._flowOrigin.y = Number(pin.element.offsetTop) || 0;
}

/**
 * A Pin's own canvas-local top-left within its parent's scope.
 *
 * A flow child is placed by flex/grid, so its live origin is the `_flowOrigin`
 * captured in the read phase ({@link captureFlowOrigin}); every other Pin is
 * placed by its own transform, so its origin is its particle x/y. Both are
 * expressed against the same scope-content origin, which is what makes them
 * interchangeable here.
 */
function localOrigin(pin) {
  return pin._flowOrigin || pin.particle;
}

/**
 * Compute cumulative global bounding box.
 *
 * A child is laid out inside its parent's scope container, so its global origin
 * is the sum over every ancestor of (ancestor origin + that ancestor's cached
 * scope offset). "Origin" is the particle x/y for a transform-placed Pin and the
 * measured live flow origin for a flow child ({@link localOrigin}), so a flow
 * child anywhere on the chain contributes where it actually renders rather than
 * where its particle last sat. The walk is depth-capped: a malformed parent cycle
 * must never hang a frame.
 */
export function globalBoundsOf(pin) {
  const local = pin.particle.getBounds();
  const origin = localOrigin(pin);
  let gx = origin.x;
  let gy = origin.y;
  let curr = pin.parent;

  for (let depth = 0; curr && depth < MAX_DEPTH; depth += 1) {
    const offset = curr._scopeOffset || ORIGIN;
    const pos = localOrigin(curr);
    gx += pos.x + offset.x;
    gy += pos.y + offset.y;
    curr = curr.parent;
  }

  return {
    minX: gx,
    minY: gy,
    maxX: gx + local.width,
    maxY: gy + local.height,
    width: local.width,
    height: local.height,
    centerX: gx + local.width / 2,
    centerY: gy + local.height / 2
  };
}

/* ------------------ REPARENT SUPPORT (Phase 8 β) ------------------ */

/**
 * The canvas-space origin of a Pin's scope well - the point a direct child's
 * parent-local (0, 0) lands at.
 *
 * A child is laid out inside its parent's scope container, so its canvas
 * position is its own local position plus this origin: the parent's global
 * top-left, plus the cached layout offset of the scope container within it.
 * This is precisely the quantity `reparentPin` (`./reparent.js`) inverts to turn
 * a canvas-space drop point into a new parent's local coordinate space - the
 * inverse of the per-ancestor sum `globalBoundsOf` walks, stopped one level up.
 *
 * @returns {{x: number, y: number}}
 */
export function scopeOriginOf(pin) {
  const bounds = globalBoundsOf(pin);
  const offset = pin._scopeOffset || ORIGIN;
  return { x: bounds.minX + offset.x, y: bounds.minY + offset.y };
}

/* ------------------ TRANSFORM WRITE ------------------ */

/** Write the Pin's spatial transform onto its element. */
export function writeTransform(pin) {
  if (!pin.element || !pin.element.style) return;
  pin.element.style.transform = formatTransform3D(
    pin.particle.x,
    pin.particle.y,
    pin.particle.z
  );
}
