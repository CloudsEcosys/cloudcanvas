/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Minimal Pin Model:
 * A pure, composable canvas entity containing only:
 *  1. Traits (composable PinTrait instances)
 *  2. Contents (Map<string, Object>)
 *  3. Vectors (Float vectors / PinParticle spatial node)
 *  4. HTML <div> DOM Element & Hierarchical Scoping
 *
 * This file is the model and its public surface. The mechanics live beside it,
 * as free functions taking the Pin as their first argument:
 *
 *   ./pin-element.js   - element structure and measurement
 *   ./pin-membership.js- DOM membership: mount, park, detach
 *   ./pin-hierarchy.js - parent and children, read from the DOM
 *   ./pin-lifecycle.js - activation, focus, lazy provisioning, reconciliation
 *   ./pin-traits.js    - trait resolution and attach/replace/detach bookkeeping
 *   ./pin-contents.js  - contents coercion, writes, and the key contract
 *   ./pin-style.js     - per-Pin appearance overrides on the root element
 *   ./pin-vectors.js   - vector-list writes and the invalidation they owe
 *   ./pin-render.js    - the invalidation contract and the synchronous render
 *   ./pin-edit.js      - the edit lock that defers rendering into a live editor
 *   ./pin-scope.js     - the parent chain and the events that bubble up it
 *   ./reload.js        - the pure reload policy those decisions are made from
 */
import { sizeOf, stateOf } from '../core/state.js';
import { particleFromOptions } from '../particles/pin-particle.js';
import { RELOAD_STRATEGIES, reloadFromOptions } from './reload.js';
import * as element from './pin-element.js';
import * as membership from './pin-membership.js';
import * as lifecycle from './pin-lifecycle.js';
import * as traitOps from './pin-traits.js';
import * as contentOps from './pin-contents.js';
import * as styleOps from './pin-style.js';
import * as vectorOps from './pin-vectors.js';
import * as renderOps from './pin-render.js';
import * as edit from './pin-edit.js';
import * as scope from './pin-scope.js';
import { childrenOf, parentOf } from './pin-hierarchy.js';

/**
 * Structure classes live with the code that builds them; they are re-exported
 * here so `pin.js` stays the single import site for the Pin model.
 */
export { CONTENT_CLASS, PIN_CLASS, SCOPE_CLASS, SELECTABLE_TEXT_CLASS } from './pin-element.js';

/**
 * Child-layout vocabulary lives with the code that writes it (`./pin-element.js`)
 * and is re-exported here so `pin.js` stays the single import site for the model.
 */
export { LAYOUT_MODES, LAYOUT_CLASS, FLOW_CHILD_CLASS, LAYOUT_GAP_PROPERTY } from './pin-element.js';

/**
 * Reload policy lives in `./reload.js`; it is re-exported here for the same
 * reason.
 */
export {
  DORMANT_CLASS,
  RELOAD_STRATEGIES,
  RELOAD_MODES,
  normalizeReloadStrategy,
  resolveReloadMode
} from './reload.js';

export class Pin extends EventTarget {
  constructor(options = {}) {
    super();
    this.id = options.id || `pin_${Math.random().toString(36).slice(2, 9)}`;

    // A utility Pin is machinery, not content: traits and a spatial node on a
    // detached element, no display, no interaction, and filtered out of every
    // manager query (`./manager.js`). The cursor Pin is one. Read-only from here.
    this.utility = Boolean(options.utility);

    // Opt-in real text selection inside the content node (`./pin-element.js`,
    // `../engine/pointer.js`); written onto the element at setup, so fixed here.
    this.selectableText = Boolean(options.selectableText);

    // Whether the card's border is painted: one class, so writable (accessor below).
    this.bordered = options.bordered;

    // Whether the default card chrome is worn: one class on the root, writable too.
    // Set before the element exists, so this only records the flag; the element is
    // built with the matching class and `setupElement` re-applies it.
    this.chrome = options.chrome;

    // 2. Contents: Map of Objects
    this.contents = new Map();
    this._initContents(options.contents || options.content);

    // 3. Traits: Composable capability dictionary
    this.traits = new Map();

    // 4. Hierarchy is read from the DOM (`parent` / `children` below), over the
    // fixed two-child structure `.cloudcanvas-pin > content + scope` built once in
    // `_setupElement`; `scopeElement` hosts child Pins and is never rewritten.
    this.contentElement = null;
    this.scopeElement = null;

    // Live layout origin of a flow child inside its parent's scope, cached at
    // measurement time for `getGlobalBounds` (`element.captureFlowOrigin`); null when transform-placed.
    this._flowOrigin = null;

    // How this Pin arranges its CHILDREN: 'free' (default) or 'row'/'column'/'grid',
    // one `is-layout-*` class on the scope well; recorded here, written by `syncLayout`.
    this._layoutGap = null;
    this.layout = options.layout;
    if (options.gap !== undefined) this.layoutGap = options.gap;

    // Conjugate renderer wiring (null until a session attaches this Pin)
    this._renderer = null;
    this._manager = null;
    this._pendingInvalidations = new Set();

    // Edit lock: while it is held, nothing renders into this Pin (`./pin-edit.js`).
    edit.initEditState(this);

    // 5. Activation & reload strategy
    lifecycle.initReloadState(this, options, reloadFromOptions(options));

    // 6. HTML <div> Element, then the spatial node that views its core record
    this.element = options.element || this._createDefaultElement(options);
    this._initParticle(options);
    this._setupElement();

    // Attach initial traits
    this._initTraits(options);

    // Initial render
    this.render();
  }

  /** Adopt the supplied spatial node, or build one, over the element (`../particles/pin-particle.js`). */
  _initParticle(options) { this.particle = particleFromOptions(this.id, options, this.element); }

  _initContents(contentsInput) { return contentOps.initContents(this, contentsInput); }

  _initTraits(options) { return traitOps.initTraits(this, options); }

  /* ------------------ ELEMENT STRUCTURE ------------------ */

  _createDefaultElement(options) { return element.createDefaultElement(this, options); }

  _setupElement() { return element.setupElement(this); }

  _buildElementStructure() { return element.buildElementStructure(this); }

  /* ------------------ OWNERSHIP ------------------ */

  /**
   * The session this Pin belongs to, or null when it belongs to none.
   *
   * Resolved through the manager rather than stored: registration with a manager
   * is the single fact that makes a Pin part of a session, so a Pin that was
   * never registered, was removed, or lives in a headless manager reports the
   * truth without anyone having to remember to clear a field.
   *
   * @returns {CloudCanvasSession|null}
   */
  get session() {
    return (this._manager && this._manager.session) || null;
  }

  /* ------------------ HIERARCHY & SCOPE API ------------------ */

  /** The Pin whose scope holds this one, read from the DOM (`./pin-hierarchy.js`); null at the root. */
  get parent() { return parentOf(this); }

  /** The Pins in this Pin's scope, in DOM order, as a fresh Set (`./pin-hierarchy.js`). */
  get children() { return childrenOf(this); }

  /** Add a child Pin into this Pin's internal scope (`./pin-scope.js`). */
  addChild(childPin) {
    if (!(childPin instanceof Pin) || childPin === this) return null;
    return scope.addChild(this, childPin);
  }

  /** Remove a child Pin from this Pin's internal scope. */
  removeChild(childPin) { return scope.removeChild(this, childPin); }

  /** @deprecated since 0.3.0 - use `Array.from(pin.children)`. Removed in 0.4.0. */
  getChildren() { return Array.from(childrenOf(this)); }

  /**
   * The persistent scope container for child Pins.
   * Built once with the rest of the element structure; this only rebuilds it for
   * Pins whose element appeared after construction.
   */
  getOrCreateScopeElement() {
    if (this.scopeElement) return this.scopeElement;
    this._buildElementStructure();
    return this.scopeElement;
  }

  /** The display-only content container (null in headless mode). */
  getContentElement() {
    if (this.contentElement) return this.contentElement;
    this._buildElementStructure();
    return this.contentElement;
  }

  /** Cumulative global bounding box, summed over the ancestor chain. */
  getGlobalBounds() { return element.globalBoundsOf(this); }

  /** The size in force, `{w, h}`: measured when there is one, else declared (the core's rule). */
  get size() { return sizeOf(stateOf(this.element)); }

  /** The global box, `{x, y, w, h}`: {@link getGlobalBounds} in the core's shape. */
  get bounds() {
    const { minX, minY, width, height } = this.getGlobalBounds();
    return { x: minX, y: minY, w: width, h: height };
  }

  /** The scope container's layout offset inside this Pin, as the core record holds it. */
  get _scopeOffset() {
    const { sx, sy } = stateOf(this.element);
    return { x: sx, y: sy };
  }

  /* ------------------ ACTIVATION & RELOAD API ------------------ */

  /** Compatibility alias for `reload === 'lazy'`. */
  get lazy() {
    return this.reload === RELOAD_STRATEGIES.LAZY;
  }

  set lazy(value) {
    this.reload = value ? RELOAD_STRATEGIES.LAZY : RELOAD_STRATEGIES.ACTIVE;
  }

  /** Wake this Pin and its subtree; provisions a lazy scope's children. */
  activate(context) { return lifecycle.activate(this, context); }

  /** Sleep this Pin and cascade to its subtree. */
  deactivate(context) { return lifecycle.deactivate(this, context); }

  /**
   * Drop everything the lazy provider produced and re-arm it.
   * @returns {number} how many child subtrees were destroyed
   */
  unload() { return lifecycle.unload(this); }

  /** Bring this Pin's DOM membership in line with its reload strategy. */
  _reconcile() { return lifecycle.reconcile(this); }

  /* ------------------ FOCUS API ------------------ */

  setFocused(focused, session) { return lifecycle.setFocused(this, focused, session); }

  /* ------------------ TRAIT MANAGEMENT API ------------------ */

  _resolveTrait(nameOrTrait, options) { return traitOps.resolveTrait(this, nameOrTrait, options); }

  /**
   * Attach a trait, by name (built from the registry) or as an instance.
   * A Pin holds at most one trait per name - use `replaceTrait` to swap one out.
   *
   * `pin.traits` is the Map itself, and it is the read surface: `traits.get`,
   * `traits.has`, and iteration are the native spellings of every lookup this
   * class used to wrap.
   */
  addTrait(nameOrTrait, options) { return traitOps.addTrait(this, nameOrTrait, options); }

  /** Swap a trait for a freshly resolved one of the same name. */
  replaceTrait(traitOrName, options) { return traitOps.replaceTrait(this, traitOrName, options); }

  removeTrait(traitName) { return traitOps.removeTrait(this, traitName); }

  /** @deprecated since 0.3.0 - use `pin.traits.get(name)`. Removed in 0.4.0. */
  getTrait(traitName) { return this.traits.get(traitName); }

  /** @deprecated since 0.3.0 - use `pin.traits.has(name)`. Removed in 0.4.0. */
  hasTrait(traitName) { return this.traits.has(traitName); }

  /** @deprecated since 0.3.0 - use `Array.from(pin.traits.values())`. Removed in 0.4.0. */
  getTraits() { return Array.from(this.traits.values()); }

  /** The trait responsible for this Pin's display, or the first trait it has. */
  get displayTrait() { return traitOps.getDisplayTrait(this); }

  /** The trait responsible for this Pin's display, or the first trait it has. */
  getDisplayTrait() { return traitOps.getDisplayTrait(this); }

  /** Swap the Pin's display trait atomically; a failed swap is rolled back. */
  setDisplayTrait(traitOrName, options) {
    return traitOps.setDisplayTrait(this, traitOrName, options);
  }

  /** @deprecated since 0.3.0 - use {@link Pin#displayTrait}. Removed in 0.4.0. */
  getType() { return this.getDisplayTrait(); }

  /** @deprecated since 0.3.0 - use {@link Pin#setDisplayTrait}. Removed in 0.4.0. */
  setType(traitOrName, options) { return this.setDisplayTrait(traitOrName, options); }

  _displayTraits() { return traitOps.displayTraits(this); }

  /* ------------------ CONTENTS MAP API (./pin-contents.js) ------------------ */

  /**
   * `pin.contents` is the Map itself, and it is the read surface: `contents.get`,
   * `contents.has`, and iteration need no wrapper. The writes below are not
   * wrappers - each one owes the renderer a frame, and that is what they are for.
   */
  setContent(key, objectOrValue) { return contentOps.setContent(this, key, objectOrValue); }

  /** Merge contents in, enforcing the display trait's `allowedKeys` contract. */
  setContents(contentsMapOrObject) { return contentOps.setContents(this, contentsMapOrObject); }

  deleteContent(key) { return contentOps.deleteContent(this, key); }

  clearContents() { return contentOps.clearContents(this); }

  /** @deprecated since 0.3.0 - use `pin.contents.get(key)`. Removed in 0.4.0. */
  getContent(key) { return this.contents.get(key); }

  /** @deprecated since 0.3.0 - use `pin.contents.has(key)`. Removed in 0.4.0. */
  hasContent(key) { return this.contents.has(key); }

  /** @deprecated since 0.3.0 - use `new Map(pin.contents)`. Removed in 0.4.0. */
  getAllContents() { return new Map(this.contents); }

  /* ------------------ APPEARANCE OVERRIDES API (./pin-style.js) ------------------ */

  /**
   * Override one appearance property on this Pin's own root box - its corner
   * radius, surface colour, bevel, padding, or flow placement. An allow-listed
   * CSS property written directly inline, where it outranks the stylesheet's
   * token default; an empty value clears it. Distinct from `contents` (what a
   * display trait renders) and from `chrome`/`bordered` (whole-card toggles).
   */
  setStyle(property, value) { return styleOps.setPinStyle(this, property, value); }

  /** Drop one appearance override, restoring the stylesheet default. */
  clearStyle(property) { return styleOps.clearPinStyle(this, property); }

  /** The override in force for a property, or '' when there is none. */
  getStyle(property) { return styleOps.getPinStyle(this, property); }

  /** Every appearance override this Pin carries, as a plain object. */
  get styleOverrides() { return styleOps.pinStyleMap(this); }

  /* ------------------ RENDERER INVALIDATION CONTRACT ------------------ */

  /**
   * Declare that this Pin needs work on the next frame.
   *
   * The public way to say "something changed that you cannot see from here" -
   * a trait holding external state, a component whose data arrived out of band.
   * Every content and structure write in the model ends in this call.
   *
   * With a renderer attached the request is queued and nothing touches the DOM;
   * otherwise the Pin renders synchronously and the kind is kept for replay when
   * a renderer eventually adopts it.
   *
   * @param {'content'|'structure'} [kind='content']
   * @throws {TypeError} on any other kind
   */
  invalidate(kind = 'content') { return renderOps.invalidate(this, kind); }

  /** @deprecated since 0.3.0 - use {@link Pin#invalidate}. Removed in 0.4.0. */
  _invalidate(kind = 'content') { return this.invalidate(kind); }

  /** Invalidation kinds recorded before a renderer existed (replayed at attach). */
  takePendingInvalidations() { return renderOps.takePendingInvalidations(this); }

  /**
   * Force this Pin's display to rebuild its subtree on the next render.
   *
   * The ordinary render path rebuilds only on a display-type swap or the `html`
   * override toggling (`./traits/display.js`), because those are the only shape
   * changes a built-in template has. A component whose `build` reads the content
   * *shape* - the slotted custom type lays out one region per slot - has no such
   * signal, so after its contents change shape a plain `setContents` would write
   * into a subtree built for the old shape. This discards that built subtree and
   * asks for a content frame, so the next render lays the new shape out.
   */
  rebuildDisplay() {
    const trait = this.getDisplayTrait();
    if (trait && typeof trait.discardBuild === 'function') trait.discardBuild(this);
    return this.invalidate('content');
  }

  /* ------------------ VECTORS API (./pin-vectors.js) ------------------ */

  addVector(value) { return vectorOps.addVector(this, value); }

  setVectors(vectorList) { return vectorOps.setVectors(this, vectorList); }

  /** Replace one vector; an out-of-range index is a no-op returning null. */
  setVector(index, value) { return vectorOps.setVector(this, index, value); }

  removeVector(index) { return vectorOps.removeVector(this, index); }

  clearVectors() { return vectorOps.clearVectors(this); }

  /** L2 norm of the vector list; the absolute value of a single vector. */
  get magnitude() { return this.particle.getMagnitude(); }

  /** Directional gradient: the single vector, or the mean of the list. */
  get gradient() { return this.particle.getGradient(); }

  /** @deprecated since 0.3.0 - use `pin.particle.getVectors()`. Removed in 0.4.0. */
  getVectors() { return this.particle.getVectors(); }

  /** @deprecated since 0.3.0 - use `pin.particle.getVector(index)`. Removed in 0.4.0. */
  getVector(index = 0) { return this.particle.getVector(index); }

  /** @deprecated since 0.3.0 - use `pin.particle.getPrimaryVector()`. Removed in 0.4.0. */
  getPrimaryVector() { return this.particle.getPrimaryVector(); }

  /** @deprecated since 0.3.0 - use {@link Pin#magnitude}. Removed in 0.4.0. */
  getMagnitude() { return this.magnitude; }

  /** @deprecated since 0.3.0 - use {@link Pin#gradient}. Removed in 0.4.0. */
  getGradient() { return this.gradient; }

  /* ------------------ EDIT LOCK (./pin-edit.js) ------------------ */

  /**
   * Hold rendering off this Pin while its content is being edited in place.
   *
   * Idempotent. Renders requested in the meantime are deferred, not dropped:
   * `endEdit` replays exactly one of them, with whatever the contents finished
   * as.
   *
   * @param {Element|null} [node] the node holding the caret, kept for the caller
   * @returns {boolean} true when this call took the lock
   */
  beginEdit(node = null) { return edit.beginEdit(this, node); }

  /** Release the edit lock and replay the render it deferred, if any. */
  endEdit() { return edit.endEdit(this); }

  /** Whether an edit is currently holding rendering off this Pin. */
  get editing() { return this._editing === true; }

  /* ------------------ SPATIAL & STATE API ------------------ */

  /**
   * Move this Pin in canvas space.
   *
   * A method rather than three setters: the three coordinates are written
   * together, and a Pin that arrives at its destination one axis at a time is a
   * Pin that rendered somewhere it was never meant to be. Reads are per-axis
   * (`pin.x`, `pin.y`, `pin.z`), because a read commits to nothing.
   */
  setPosition(x, y, z = this.particle.z) {
    this.particle.setPosition(x, y, z);
    // Attached Pins get their transform from the renderer's position diff;
    // unattached ones still write it immediately.
    if (!this._renderer) this.renderPosition();
  }

  /** Canvas-space position, as the spatial node holds it. */
  get x() { return this.particle.x; }

  get y() { return this.particle.y; }

  get z() { return this.particle.z; }

  /** Whether the particle engine leaves this Pin exactly where it was put. */
  get pinned() { return this.particle.pinned; }

  set pinned(value) { this.particle.pinned = Boolean(value); }

  /** @deprecated since 0.3.0 - use {@link Pin#pinned}. Removed in 0.4.0. */
  setPinned(pinned) { this.pinned = pinned; }

  /** Selection state, owned by `SelectableTrait`; false without one. */
  get selected() {
    const sel = this.traits.get('selectable');
    return sel ? sel.selected : false;
  }

  set selected(value) {
    const sel = this.traits.get('selectable');
    if (!sel) return;
    if (value) sel.select(this);
    else sel.deselect(this);
  }

  /** @deprecated since 0.3.0 - use {@link Pin#selected}. Removed in 0.4.0. */
  setSelected(selected) { this.selected = selected; }

  /** Drag state, owned by `DraggableTrait`; false without one. */
  get dragging() {
    const drag = this.traits.get('draggable');
    return drag ? drag.dragging : false;
  }

  set dragging(value) {
    const drag = this.traits.get('draggable');
    if (!drag) return;
    drag.dragging = Boolean(value);
    if (this.element && this.element.classList) {
      this.element.classList.toggle('is-dragging', drag.dragging);
    }
  }

  /** @deprecated since 0.3.0 - use {@link Pin#dragging}. Removed in 0.4.0. */
  setDragging(dragging) { this.dragging = dragging; }

  /**
   * Whether the card's border is painted. Default true, and independent of
   * `chrome`: that takes the whole card away, this leaves surface, padding and
   * shadow where they were and stops only the border (`./pin-element.js`).
   */
  get bordered() { return this._bordered !== false; }

  set bordered(value) { element.setBordered(this, value); }

  /**
   * Whether this Pin wears the default card chrome: the surface, padding, radius,
   * border and shadow. Default true. `chrome: false` is what a component drawing
   * its own surface asks for - `contentElement` becomes the Pin's own boundary,
   * with no card around it.
   *
   * Structurally one class on the root, exactly like `bordered` - toggling it
   * never touches `contentElement` or its children (the two-child structure is
   * fixed and built once). It differs from `bordered` in one way only: chrome
   * carries real geometry (padding, border width, shadow), so the setter re-measures
   * through `invalidate('content')` where `bordered` - a transparent border that
   * moves nothing - does not (`./pin-element.js`).
   */
  get chrome() { return this._chrome !== false; }

  set chrome(value) { element.setChrome(this, value); }

  /**
   * How this Pin arranges its CHILDREN: `'free'` (default - every child absolutely
   * positioned by its own transform, unchanged), or `'row'` / `'column'` / `'grid'`,
   * which lay the scope well out with flex or grid so the children flow.
   *
   * Structurally the twin of `chrome`: one class, live-settable - but on the scope
   * well rather than the root, because it is about how the children sit, not how
   * this Pin does. Switching a container to a flow mode makes every existing child
   * a flow child (`position: relative`, no transform); switching back to `'free'`
   * restores absolute positioning (`./pin-element.js`). An unknown value throws.
   */
  get layout() { return this._layout || 'free'; }

  set layout(value) { element.setLayout(this, value); }

  /**
   * Gap between children in a non-`free` layout, in pixels, written as the
   * `--cc-layout-gap` custom property all three flow modes read. Null (the
   * default) leaves the stylesheet's own spacing token in place.
   */
  get layoutGap() { return this._layoutGap; }

  set layoutGap(value) { element.setLayoutGap(this, value); }

  /** Request a layout measurement (batched when a renderer is attached). */
  syncDimensions() { return element.syncDimensions(this); }

  /** Read this Pin's layout box straight from the DOM (read phase only). */
  measureLayout() { return element.measureLayout(this); }

  mount(parentContainer) { return membership.mountInto(this, parentContainer); }

  /** Park the element: out of the document, its place and parent kept. */
  unmount() { return membership.unmountElement(this); }

  /* ------------------ TICK & RENDERING HOOKS ------------------ */

  /** Execute trait tick lifecycle hooks, then tick the subtree. */
  tick(dt = 1, context = {}) { return renderOps.tick(this, dt, context); }

  /** Render spatial transform */
  renderPosition() { return element.writeTransform(this); }

  /** Run every trait's `onRender` hook against the display-only content element. */
  renderContent(context = {}) { return renderOps.renderContent(this, context); }

  /** Full synchronous render: contents, measurement, transform, and children. */
  render(context = {}) { return renderOps.render(this, context); }

  /* ------------------ EVENT TRANSMISSION ------------------ */

  _normalizeTransmitEvent(event) { return scope.normalizeTransmitEvent(this, event); }

  /**
   * Transmit an event through this Pin and up its scope chain.
   * Returns every trait `onTransmit` result collected along the walk.
   */
  transmit(event, context = {}) { return scope.transmit(this, event, context); }

  /* ------------------ BREADCRUMB / SCOPE ACCESS ------------------ */

  /** Parent chain, nearest first: [parent, grandparent, ... root]. */
  ancestors() { return scope.ancestorsOf(this); }

  /** Root-first trail ending at this pin: [root, ... parent, this]. */
  breadcrumb() {
    return [...this.ancestors().reverse(), this];
  }

  /** Nearest ancestor's trait instance (never this pin's own), or null. */
  scopeTrait(name) { return scope.scopeTrait(this, name); }

  /** Read a value off the nearest ancestor trait that defines it. */
  deriveFromScope(traitName, key) { return scope.deriveFromScope(this, traitName, key); }

  /** Tear this Pin down, subtree and all (`./pin-lifecycle.js`). */
  destroy() { lifecycle.destroy(this); }
}
