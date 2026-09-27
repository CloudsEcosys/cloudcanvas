/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Null-pin cursors: the focus reticle, the selection ring, and the activation
 * brackets, all carried by one utility Pin.
 *
 * A cursor is not a decoration bolted onto the focused Pin - it is a Pin of its
 * own (`__cursor__`, `utility: true`), holding one trait per cursor state. That
 * Pin has no element, no display trait and no interaction: it is a null pin, a
 * pure carrier of traits, invisible to `getAllPins()` and to every query.
 *
 * Each cursor trait owns:
 *   - a `target` Pin (or null), written only by the session, and
 *   - one persistent `<g data-cursor="NAME">` inside the shared overlay `<svg>`.
 *
 * The overlay layer is untransformed, so cursors are drawn in *screen* space:
 * the target's canvas bounds are projected through the viewport exactly once per
 * change. Change means one of three things - a different target, a moved camera,
 * or a target whose own geometry moved - and nothing else redraws. An idle frame
 * therefore performs zero DOM writes, the same gating discipline the per-trait
 * SVG groups use (`src/engine/svg-groups.js`).
 *
 * The three targets are independent: three different Pins can be focused,
 * selected and activated at once, and each cursor tracks its own.
 *
 * A cursor never outlives its target's visibility. A Pin that went to sleep, was
 * unmounted, or fell outside the promoted render root is invisible, and a cursor
 * drawn over an invisible Pin is a cursor over nothing - so the drawing is
 * withdrawn. The *target* is kept: the Pin is gone from the screen, not from the
 * cursor, and the cursor comes back with it.
 *
 * Every cursor is a registry definition, so re-registering `cursor-focus` (or
 * either sibling) with another constructor reskins it wholesale.
 */
import { PinTrait } from './traits/base.js';
import { traitRegistry } from './traits/registry.js';
import {
  createFocusCursorSVG,
  createFrustumProjectionSVG,
  safeColor,
  safeNumber
} from '../graphics/primitives/primitives.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Id of the single utility Pin every cursor trait rides on. */
export const CURSOR_PIN_ID = '__cursor__';

/** Capability every cursor trait declares, whatever class implements it. */
export const CURSOR_CAPABILITY = 'cursor';

export const CURSOR_FOCUS = 'cursor-focus';
export const CURSOR_SELECTED = 'cursor-selected';
export const CURSOR_ACTIVATED = 'cursor-activated';

/** The three cursor states, in the order they are attached to the cursor Pin. */
export const CURSOR_TRAIT_NAMES = Object.freeze([CURSOR_FOCUS, CURSOR_SELECTED, CURSOR_ACTIVATED]);

/** Class of the shared, pointer-transparent `<svg>` the cursors draw into. */
export const CURSOR_LAYER_CLASS = 'cloudcanvas-cursor-layer';

/** Never a real viewport version; a sentinel meaning "never drawn". */
const NO_VERSION = -1;

/*
 * Cursor colours are themable like everything else, but they are interpolated
 * into SVG attributes rather than matched by a stylesheet rule, so each one is a
 * custom-property read written out in full. The inner fallback keeps the focus
 * reticle tied to `--cc-focus` - a theme that moves the focus colour moves the
 * reticle with it, without knowing the cursor tokens exist.
 */
export const CURSOR_FOCUS_COLOR = 'var(--cc-cursor-focus, var(--cc-focus, #833446))';
export const CURSOR_SELECTED_COLOR = 'var(--cc-cursor-selected, #38bdf8)';
export const CURSOR_ACTIVATED_COLOR = 'var(--cc-cursor-activated, #34d399)';

/** Caption colour; the stroke is a marker, the caption is text with a contrast
 *  floor the focus red cannot clear (`FOCUS_LABEL_COLOR`, `primitives.js`). */
export const CURSOR_LABEL_COLOR = 'var(--cc-cursor-label, var(--cc-text, #e2e8f0))';

/** Framing used when the frame context carries no measured host box. */
const DEFAULT_HOST_RECT = Object.freeze({ width: 800, height: 600, left: 0, top: 0 });

/** Inline style of the shared layer: full-bleed, inert, above the plane. */
const LAYER_STYLE = 'position:absolute;top:0;left:0;width:100%;height:100%;'
  + 'pointer-events:none;overflow:visible;';

/**
 * The one `<svg>` every cursor group lives in, created inside the session's
 * overlay layer. Idempotent: a re-mounted session reuses the existing layer.
 */
export function createCursorLayer(overlayElement) {
  if (!overlayElement || typeof document === 'undefined') return null;

  const existing = overlayElement.querySelector(`svg.${CURSOR_LAYER_CLASS}`);
  if (existing) return existing;

  const layer = document.createElementNS(SVG_NS, 'svg');
  layer.setAttribute('class', CURSOR_LAYER_CLASS);
  layer.setAttribute('style', LAYER_STYLE);
  overlayElement.appendChild(layer);
  return layer;
}

/**
 * Project a Pin's canvas bounds into host-relative screen pixels.
 *
 * This is the screen-space math the focussable trait used to run inside the SVG
 * layer pass; it lives here now because the overlay is the only untransformed
 * layer, and so the only place a screen-space drawing is correct.
 */
export function screenBoundsOf(pin, context = {}) {
  const hostRect = context.hostRect || DEFAULT_HOST_RECT;
  const viewport = context.viewport;
  const bounds = pin.getGlobalBounds();
  if (!viewport || typeof viewport.canvasToScreen !== 'function') return bounds;

  const topLeft = viewport.canvasToScreen(bounds.minX, bounds.minY, hostRect);
  const bottomRight = viewport.canvasToScreen(bounds.maxX, bounds.maxY, hostRect);
  const left = hostRect.left || 0;
  const top = hostRect.top || 0;

  return {
    minX: topLeft.x - left,
    minY: topLeft.y - top,
    maxX: bottomRight.x - left,
    maxY: bottomRight.y - top
  };
}

/**
 * True when a Pin's backing node is still in the document.
 *
 * A Pin with no element at all is headless, not hidden: it keeps a position and
 * bounds, so it counts as present and a cursor over it stays meaningful.
 */
function isPinMounted(pin) {
  const element = pin ? pin.element : null;
  if (!element) return Boolean(pin);
  return element.isConnected !== false;
}

/**
 * Whether a Pin is currently drawable at all: awake, in the document, and
 * inside the render root that is on screen.
 *
 * This is the same three-part question the renderer answers when it decides to
 * mount a Pin, asked from the outside - the cursor layer is untransformed and
 * never visits the renderer's sets, so it re-asks rather than inferring.
 */
export function isPinVisible(pin, context = {}) {
  if (!pin || pin.active === false) return false;
  if (!isPinMounted(pin)) return false;

  const participates = context.participates;
  if (typeof participates === 'function' && !participates(pin)) return false;
  return true;
}

/**
 * Base class for every cursor: target ownership, the persistent group, and the
 * write gate. Subclasses implement `draw()` and nothing else.
 */
export class CursorTrait extends PinTrait {
  constructor(options = {}, fixed = {}) {
    super(options, {
      name: fixed.name,
      capabilities: [CURSOR_CAPABILITY, ...(fixed.capabilities || [])]
    });

    /** The shared overlay `<svg>`; supplied by `createCursorPin`. */
    this.layer = options.layer || null;

    this.color = safeColor(options.color, fixed.color);
    this.padding = safeNumber(options.padding !== undefined ? options.padding : fixed.padding, 8);

    /**
     * Caption for cursors that draw one. Three states, not two:
     *   - a non-empty string is used verbatim,
     *   - `''` (the default) falls back to the target Pin's own title, and
     *   - `null` is an explicit "no caption at all".
     */
    this.label = options.label !== undefined ? options.label : (fixed.label || '');

    /** @type {Pin|null} the Pin this cursor points at; the session is its writer. */
    this.target = null;

    this._group = null;
    this._shape = null;
    this._drawnTarget = undefined;
    this._drawnVersion = NO_VERSION;
    this._visible = false;
  }

  /**
   * Point the cursor at a Pin, or clear it with `null`.
   * @returns {boolean} true when the target actually changed
   */
  setTarget(pin) {
    const next = pin || null;
    if (next === this.target) return false;
    this.target = next;
    return true;
  }

  /** Re-host the cursor in another overlay layer, dropping the old group. */
  setLayer(element) {
    const next = element || null;
    if (next === this.layer) return this.layer;

    this.layer = next;
    this._group = null;
    this._shape = null;
    this._drawnTarget = undefined;
    this._drawnVersion = NO_VERSION;
    this._visible = false;
    return this.layer;
  }

  /**
   * The target this cursor may draw on right now, or null when it has none or
   * the one it holds is not on screen.
   *
   * Withdrawing the drawing is not the same as forgetting the Pin: `this.target`
   * survives, so waking the Pin, remounting it, or popping back to a render root
   * that includes it brings the cursor straight back.
   */
  visibleTarget(context = {}) {
    return isPinVisible(this.target, context) ? this.target : null;
  }

  /**
   * Redraw when - and only when - this cursor's own inputs moved.
   *
   * @param {{context: object, viewportVersion: number, isDirty: (pin) => boolean}} frame
   * @returns {boolean} true when the DOM was written
   */
  renderCursor(frame) {
    if (!this.layer || !frame || !frame.context) return false;

    const target = this.visibleTarget(frame.context);
    if (!this._changed(target, frame)) return false;

    this._drawnTarget = target;
    this._drawnVersion = frame.viewportVersion;

    if (!target) return this._setVisible(false);

    this.draw(this.group(), screenBoundsOf(target, frame.context), frame.context);
    this._setVisible(true);
    return true;
  }

  /** True when the drawn output can no longer be trusted. */
  _changed(target, frame) {
    if (this._drawnTarget !== target) return true;
    if (this._drawnVersion !== frame.viewportVersion) return true;
    if (target && typeof frame.isDirty === 'function') return frame.isDirty(target);
    return false;
  }

  /** The cursor's `<g>`, created inside the shared layer on first draw. */
  group() {
    if (this._group) return this._group;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('data-cursor', this.name);
    this.layer.appendChild(group);

    this._group = group;
    return group;
  }

  /** The cursor's one persistent shape node, created once with its static attributes. */
  shape(tag, attributes = {}) {
    if (this._shape) return this._shape;

    const node = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, value);
    }
    this.group().appendChild(node);

    this._shape = node;
    return node;
  }

  /** Show or hide the group, writing the attribute only on a real change. */
  _setVisible(visible) {
    if (!this._group || this._visible === visible) return false;
    this._group.setAttribute('display', visible ? 'inline' : 'none');
    this._visible = visible;
    return true;
  }

  /**
   * The caption to draw, resolving the default to the target's own title.
   *
   * The title is read defensively: `contents` is a Map on a Pin, but a cursor
   * may be pointed at anything Pin-shaped, and a missing title is a blank
   * caption rather than a thrown frame.
   */
  resolveLabel() {
    if (this.label === null) return '';
    if (this.label) return this.label;

    const contents = this.target ? this.target.contents : null;
    if (!contents || typeof contents.get !== 'function') return '';

    const title = contents.get('title');
    return typeof title === 'string' ? title : '';
  }

  /**
   * Draw the cursor for a target's screen bounds. Implemented by subclasses.
   * @abstract
   */
  draw(group, screenBounds, context) {}

  /** A destroyed cursor Pin takes its groups out of the overlay with it. */
  onDetach() {
    if (this._group && this._group.parentNode) {
      this._group.parentNode.removeChild(this._group);
    }
    this._group = null;
    this._shape = null;
    this._drawnTarget = undefined;
    this._drawnVersion = NO_VERSION;
    this._visible = false;
  }
}

/**
 * The focused Pin's reticle and frustum, drawn from the same primitives the
 * focussable trait used to emit into the SVG layer. The generators return
 * markup, so this is the one cursor that assigns `innerHTML` - once per change,
 * never per frame.
 */
export class CursorFocusTrait extends CursorTrait {
  constructor(options = {}) {
    super(options, {
      name: CURSOR_FOCUS,
      color: CURSOR_FOCUS_COLOR,
      padding: 8,
      // No default caption: the reticle says the Pin's own title, not a sentence
      // about the framework's navigation model.
      label: ''
    });
    this.showFrustum = options.showFrustum !== undefined ? Boolean(options.showFrustum) : true;
    this.labelColor = safeColor(options.labelColor, CURSOR_LABEL_COLOR);
  }

  draw(group, bounds, context) {
    group.innerHTML = this.frustum(bounds, context)
      + createFocusCursorSVG(bounds, {
        color: this.color,
        labelColor: this.labelColor,
        label: this.resolveLabel(),
        padding: this.padding
      });
  }

  /**
   * The frustum markup for this draw, or nothing.
   *
   * The spikes point from the *parent scope's* box to the focused Pin - that is
   * the whole statement the frustum makes, "this Pin sits inside that scope". A
   * Pin at the canvas root sits inside nothing, so it gets no frustum, and a
   * parent that has never been measured has no box to point from, so it gets
   * none either rather than four spikes collapsed onto the origin.
   */
  frustum(bounds, context) {
    if (!this.showFrustum) return '';

    const parent = this.target ? this.target.parent : null;
    if (!parent) return '';

    const parentBounds = screenBoundsOf(parent, context);
    if (!(parentBounds.maxX - parentBounds.minX > 0)) return '';

    return createFrustumProjectionSVG(parentBounds, bounds, { stroke: this.color });
  }
}

/** The most recently selected Pin's ring: one retained `<rect>`, mutated in place. */
export class CursorSelectedTrait extends CursorTrait {
  constructor(options = {}) {
    super(options, { name: CURSOR_SELECTED, color: CURSOR_SELECTED_COLOR, padding: 6 });
  }

  draw(group, bounds) {
    const node = this.shape('rect', {
      class: 'cloudcanvas-cursor-selected',
      fill: 'none',
      rx: 6,
      'stroke-width': 2,
      'stroke-dasharray': '3,3'
    });

    node.setAttribute('stroke', this.color);
    node.setAttribute('x', (bounds.minX - this.padding).toFixed(1));
    node.setAttribute('y', (bounds.minY - this.padding).toFixed(1));
    node.setAttribute('width', (bounds.maxX - bounds.minX + this.padding * 2).toFixed(1));
    node.setAttribute('height', (bounds.maxY - bounds.minY + this.padding * 2).toFixed(1));
  }
}

/** The most recently activated Pin's brackets: one retained `<path>`, `d` rewritten. */
export class CursorActivatedTrait extends CursorTrait {
  constructor(options = {}) {
    super(options, { name: CURSOR_ACTIVATED, color: CURSOR_ACTIVATED_COLOR, padding: 4 });
    this.armLength = safeNumber(options.armLength, 12);
  }

  draw(group, bounds) {
    const node = this.shape('path', {
      class: 'cloudcanvas-cursor-activated',
      fill: 'none',
      'stroke-width': 2,
      'stroke-linecap': 'round'
    });

    node.setAttribute('stroke', this.color);
    node.setAttribute('d', bracketPath(bounds, this.padding, this.armLength));
  }
}

/** Four corner brackets around a padded box, as one path. */
function bracketPath(bounds, padding, arm) {
  const x = bounds.minX - padding;
  const y = bounds.minY - padding;
  const right = bounds.maxX + padding;
  const bottom = bounds.maxY + padding;

  return [
    `M ${x} ${y + arm} L ${x} ${y} L ${x + arm} ${y}`,
    `M ${right - arm} ${y} L ${right} ${y} L ${right} ${y + arm}`,
    `M ${right} ${bottom - arm} L ${right} ${bottom} L ${right - arm} ${bottom}`,
    `M ${x + arm} ${bottom} L ${x} ${bottom} L ${x} ${bottom - arm}`
  ].join(' ');
}

/** The built-in cursor definitions, in registry form. */
const CURSOR_DEFINITIONS = Object.freeze([
  [CURSOR_FOCUS, CursorFocusTrait],
  [CURSOR_SELECTED, CursorSelectedTrait],
  [CURSOR_ACTIVATED, CursorActivatedTrait]
]);

/**
 * Register the built-in cursor definitions. Idempotent, so a caller that has
 * already re-registered `cursor-focus` with its own class keeps it. Installed
 * as a default provider by `../defaults.js`, so `traitRegistry.clear()` brings
 * the cursors back; nothing registers on import.
 */
export function registerCursorTraits(registry = traitRegistry) {
  for (const [name, ctor] of CURSOR_DEFINITIONS) {
    if (!registry.has(name)) registry.register(name, ctor);
  }
  return registry;
}

/**
 * Build the session's cursor Pin: one utility Pin carrying the three cursor
 * traits, drawing into a shared `<svg>` in the session's overlay layer.
 *
 * The traits come out of the registry by name, so re-registering a definition
 * before the session mounts is all a caller needs to reskin a cursor.
 */
export function createCursorPin(session) {
  if (!session || !session.pinManager) return null;

  const layer = createCursorLayer(session.overlayElement);
  const traits = CURSOR_TRAIT_NAMES
    .filter((name) => traitRegistry.has(name))
    .map((name) => traitRegistry.create(name, { layer }));

  return session.pinManager.createPin({ id: CURSOR_PIN_ID, utility: true, traits });
}

/**
 * Run every cursor on a Pin. Each one decides for itself whether anything
 * changed, so an idle frame writes nothing at all.
 *
 * @returns {number} how many cursors were redrawn
 */
export function renderCursors(pin, frame) {
  if (!pin || !pin.traits) return 0;

  let written = 0;
  for (const trait of pin.traits.values()) {
    if (typeof trait.renderCursor !== 'function') continue;
    if (trait.renderCursor(frame)) written += 1;
  }
  return written;
}
