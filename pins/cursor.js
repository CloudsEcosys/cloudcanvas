/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Null-pin cursors: the focus reticle, the selection ring and the activation
 * brackets, carried by one utility Pin (`__cursor__`, `utility: true`) holding
 * one trait per cursor. That Pin has no element, no display and no interaction,
 * and is invisible to every query; the session writes each trait's `target`.
 *
 * The cursor itself - the record, the change gate, the screen-space projection
 * and the three drawings - is the cursors add-on (`../addons/cursors.js`); the
 * classes here are its Pin shell, each instance being the record. Every cursor
 * is a registry definition, so re-registering `cursor-focus` (or a sibling)
 * with another class reskins it wholesale: a subclass overrides `draw()`.
 */
import { PinTrait } from './traits/base.js';
import { traitRegistry } from './traits/registry.js';
import {
  CURSOR_ACTIVATED,
  CURSOR_CAPABILITY,
  CURSOR_DEFAULTS,
  CURSOR_FOCUS,
  CURSOR_KINDS,
  CURSOR_METHODS,
  CURSOR_SELECTED,
  CURSOR_TRAIT_NAMES,
  createCursorLayer,
  cursorFields,
  isTargetVisible
} from '../addons/cursors.js';

export {
  CURSOR_ACTIVATED,
  CURSOR_ACTIVATED_COLOR,
  CURSOR_CAPABILITY,
  CURSOR_FOCUS,
  CURSOR_FOCUS_COLOR,
  CURSOR_LABEL_COLOR,
  CURSOR_LAYER_CLASS,
  CURSOR_SELECTED,
  CURSOR_SELECTED_COLOR,
  CURSOR_TRAIT_NAMES,
  screenBoundsOf
} from '../addons/cursors.js';
export { createCursorLayer };

/** Id of the single utility Pin every cursor trait rides on. */
export const CURSOR_PIN_ID = '__cursor__';

/** Whether a Pin is drawable: awake, in the document, inside the render root on screen. */
export const isPinVisible = isTargetVisible;

/**
 * Base class for every cursor: target ownership, the persistent group, the
 * write gate (`CURSOR_METHODS`). A subclass implements `draw()` and nothing else.
 */
export class CursorTrait extends PinTrait {
  constructor(options = {}, fixed = {}) {
    super(options, { name: fixed.name, capabilities: [CURSOR_CAPABILITY, ...(fixed.capabilities || [])] });
    Object.assign(this, cursorFields(options, fixed));
  }

  /** Draw for a target's screen bounds. @abstract */
  draw(group, screenBounds, context) {}
}
Object.assign(CursorTrait.prototype, CURSOR_METHODS);

/** A cursor class of one of the three built-in kinds: its defaults, extra options and drawing. */
function builtInCursor(name) {
  const kind = CURSOR_KINDS[name];
  const Cursor = class extends CursorTrait {
    constructor(options = {}) {
      super(options, CURSOR_DEFAULTS[name]);
      Object.assign(this, kind.extra(options));
    }
  };
  Object.assign(Cursor.prototype, kind.methods);
  return Cursor;
}

/** The focused Pin's reticle, and the frustum from its parent scope. */
export class CursorFocusTrait extends builtInCursor(CURSOR_FOCUS) {}

/** The most recently selected Pin's ring. */
export class CursorSelectedTrait extends builtInCursor(CURSOR_SELECTED) {}

/** The most recently activated Pin's brackets. */
export class CursorActivatedTrait extends builtInCursor(CURSOR_ACTIVATED) {}

/** The built-in cursor definitions, in registry form. */
const CURSOR_DEFINITIONS = /* @__PURE__ */ Object.freeze([
  [CURSOR_FOCUS, CursorFocusTrait],
  [CURSOR_SELECTED, CursorSelectedTrait],
  [CURSOR_ACTIVATED, CursorActivatedTrait]
]);

/**
 * Register the built-in cursor definitions; one already registered is kept.
 * Installed as a default provider by `../defaults.js`; nothing registers on import.
 */
export function registerCursorTraits(registry = traitRegistry) {
  for (const [name, ctor] of CURSOR_DEFINITIONS) {
    if (!registry.has(name)) registry.register(name, ctor);
  }
  return registry;
}

/**
 * Build the session's cursor Pin: one utility Pin carrying the three cursor
 * traits, out of the registry by name, drawing into the overlay's shared `<svg>`.
 */
export function createCursorPin(session) {
  if (!session || !session.pinManager) return null;

  const layer = createCursorLayer(session.overlayElement);
  const traits = CURSOR_TRAIT_NAMES
    .filter((name) => traitRegistry.has(name))
    .map((name) => traitRegistry.create(name, { layer }));
  return session.pinManager.createPin({ id: CURSOR_PIN_ID, utility: true, traits });
}

/** Run every cursor on a Pin; each decides for itself. @returns {number} how many were redrawn */
export function renderCursors(pin, frame) {
  if (!pin || !pin.traits) return 0;
  let written = 0;
  for (const trait of pin.traits.values()) {
    if (typeof trait.renderCursor === 'function' && trait.renderCursor(frame)) written += 1;
  }
  return written;
}
