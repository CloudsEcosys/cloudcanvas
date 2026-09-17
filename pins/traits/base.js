/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Base trait primitives: the generic PinEvent signal and the PinTrait lifecycle base class.
 */

export const DEFAULT_EVENT_TYPE = 'message';

/**
 * Native CustomEvent carrying CloudCanvas signal semantics.
 *
 * The wire format lives entirely in `detail`, so the event survives any
 * `dispatchEvent()` round-trip and can be observed by plain DOM listeners:
 *   - `detail.payload` : the transmitted value (aliased by `event.payload`)
 *   - `detail.source`  : origin Pin (or origin Event, for wrapped foreign events)
 *
 * `stopPropagation()` / `preventDefault()` stay native; `cancelled` is the legacy
 * alias for `defaultPrevented`. `target` is never assigned by hand - the DOM owns it.
 */
export class PinEvent extends CustomEvent {
  constructor(type, options = {}) {
    const payload = options.payload !== undefined
      ? options.payload
      : (options.data !== undefined ? options.data : null);
    const extraDetail = options.detail && typeof options.detail === 'object' ? options.detail : null;

    super(type || DEFAULT_EVENT_TYPE, {
      bubbles: options.bubbles !== undefined ? Boolean(options.bubbles) : true,
      cancelable: true,
      detail: {
        ...(extraDetail || {}),
        payload,
        source: options.source || options.target || null
      }
    });

    this.timestamp = options.timestamp || Date.now();
  }

  get payload() {
    return this.detail ? this.detail.payload : undefined;
  }

  /** Legacy alias for `defaultPrevented`; a cancelled event stops bubbling. */
  get cancelled() {
    return this.defaultPrevented;
  }
}

/**
 * Pin lifecycle signals: the one mechanism by which state changes *inside* a Pin
 * reach a session-level observer.
 *
 * A Pin is an EventTarget, but its events never cross into another Pin, so the
 * PinManager - the only component that knows every Pin - subscribes to these
 * types on registration and re-broadcasts them (`PinManager.onSignal`). The
 * session is the single consumer: it is what turns `activate` and `select` into
 * cursor targets, and `deactivate` and `destroy` into their release. Nothing
 * else listens, and nothing polls.
 *
 * `activate` / `deactivate` are a pair, and both are announced exactly once per
 * real transition: an activation cursor is claimed by the first and released by
 * the second, because a Pin that went back to sleep has genuinely stopped being
 * the most recently activated one.
 *
 * `drag:start` / `drag:end` are the same shape for movement, emitted by
 * `DraggableTrait` at the drag *threshold* rather than at the press - a click
 * that never crossed it emits neither, so a listener that persists positions is
 * never woken by a click. `drag:end` carries the final canvas position and a
 * `cancelled` flag (the drag the platform took away, see `cancelDrag`).
 *
 * `resize:start` / `resize:end` are the same pair for the Pin's *box*, emitted
 * by `ResizableTrait` (`./resizable.js`) at the same threshold and with the same
 * `cancelled` convention. `resize:start` carries `{width, height, direction}`,
 * the box the gesture is leaving from; `resize:end` carries the final box.
 *
 * `edit` is the edit lock's transition, payload `true` on entry and `false` on
 * exit; the session announces both (`../../engine/announcer.js`).
 */
export const PIN_SIGNAL_TYPES = Object.freeze([
  'activate',
  'deactivate',
  'select',
  'destroy',
  'drag:start',
  'drag:end',
  'resize:start',
  'resize:end',
  'edit',
  'press'
]);

/**
 * Announce a lifecycle signal on the Pin itself.
 *
 * Non-bubbling by design: a signal describes the Pin it happened to, and the
 * manager is already listening on every Pin, so bubbling would only duplicate it
 * up the scope chain.
 *
 * @returns {boolean} true when the signal was dispatched
 */
export function emitPinSignal(pin, type, payload = null) {
  if (!pin || typeof pin.dispatchEvent !== 'function') return false;
  pin.dispatchEvent(new PinEvent(type, { source: pin, payload, bubbles: false }));
  return true;
}

/**
 * Base PinTrait class from which all Pin capabilities inherit.
 *
 * Subclasses pass their invariants through `fixed` instead of spreading caller
 * options over them, so a caller can never silently rename a trait or drop the
 * capabilities its own implementation depends on:
 *   - `fixed.name`         : the subclass identity. Conflicting `options.name` throws.
 *   - `fixed.capabilities` : always present; caller capabilities are unioned in, never replace.
 */
export class PinTrait {
  constructor(options = {}, fixed = {}) {
    if (fixed.name && options.name && options.name !== fixed.name) {
      throw new Error(
        `PinTrait: "${fixed.name}" is a fixed trait name and cannot be renamed to "${options.name}"`
      );
    }

    this.name = fixed.name || options.name || this.constructor.name.toLowerCase().replace(/trait$/, '');
    this.capabilities = new Set([
      ...(fixed.capabilities || []),
      ...(options.capabilities || [])
    ]);
    this.options = options;

    if (typeof options.onAttach === 'function') this.onAttach = options.onAttach;
    if (typeof options.onDetach === 'function') this.onDetach = options.onDetach;
    if (typeof options.onTick === 'function') this.onTick = options.onTick;
    if (typeof options.onRender === 'function') this.onRender = options.onRender;
    if (typeof options.onGlobalBuild === 'function') this.onGlobalBuild = options.onGlobalBuild;
    if (typeof options.onGlobalUpdate === 'function') this.onGlobalUpdate = options.onGlobalUpdate;
    if (typeof options.onActivate === 'function') this.onActivate = options.onActivate;
    if (typeof options.onDeactivate === 'function') this.onDeactivate = options.onDeactivate;
    if (typeof options.onFocus === 'function') this.onFocus = options.onFocus;
    if (typeof options.onUnfocus === 'function') this.onUnfocus = options.onUnfocus;
    if (typeof options.onTransmit === 'function') this.onTransmit = options.onTransmit;
    if (typeof options.onPointerDown === 'function') this.onPointerDown = options.onPointerDown;
    if (typeof options.onPointerMove === 'function') this.onPointerMove = options.onPointerMove;
    if (typeof options.onPointerUp === 'function') this.onPointerUp = options.onPointerUp;
    // `onAction` is the keyboard's activation hook (`../../engine/keyboard.js`).
    // It has no base-class default on purpose - the key handler reads the
    // method's *presence* as the affordance, and a no-op inherited by every
    // trait would make all of them claim it - so an options handler is the only
    // way a plain `new PinTrait({...})` can declare one.
    if (typeof options.onAction === 'function') this.onAction = options.onAction;
  }

  hasCapability(cap) {
    return this.capabilities.has(cap);
  }

  onAttach(pin) {}
  onDetach(pin) {}
  onTick(pin, dt, context) {}
  onRender(pin, contents, element, context) {}

  /**
   * Build a global-render trait's persistent SVG subtree, once.
   *
   * The counterpart of a `DisplayTrait`'s `build`, at the group level: the SVG
   * group layer (`../../engine/svg-groups.js`) hands over the trait's own
   * `<g data-trait>` the first time the group is drawn, and this constructs
   * whatever lives inside it - with `h()` (`../../graphics/primitives/element.js`),
   * never `innerHTML` - and returns the live node bindings the update pass writes
   * through. It is called exactly once per group; every subsequent draw is an
   * `onGlobalUpdate`. A trait with no persistent structure returns the bindings
   * it wants to keep (often just `{ host }`).
   *
   * @param {Element} host the trait's `<g>`, already in the SVG layer
   * @param {Pin[]} pins the participating carriers
   * @param {object} context the frame context
   * @returns {object} bindings passed to every {@link onGlobalUpdate}
   */
  onGlobalBuild(host, pins, context) { return { host }; }

  /**
   * Mutate a global-render trait's subtree on a frame its inputs moved.
   *
   * The counterpart of a `DisplayTrait`'s `update`: it runs only when the layer's
   * dirty gate fired (a carrier moved, the trait bumped its `revision`, a
   * dependency changed), and mutates the nodes `onGlobalBuild` returned - through
   * the diffing kit (`setAttr`, `reconcileKeyedList`) so an unchanged node is
   * never rewritten. An idle frame never reaches here at all.
   *
   * @param {object} bindings whatever {@link onGlobalBuild} returned
   * @param {Pin[]} pins the participating carriers
   * @param {object} context the frame context
   */
  onGlobalUpdate(bindings, pins, context) {}

  /**
   * Pins this trait's global render reads but does not carry.
   *
   * The SVG group layer redraws a trait when a *carrier* changed; anything else
   * the output is anchored to is invisible to it. A trait that draws to other
   * Pins declares them here and the layer folds them into the same dirty test.
   *
   * Called at most once per Pin per frame, only when no cheaper gate already
   * fired. Return the same array each call (refilled in place) or `null`.
   *
   * @returns {Pin[]|null}
   */
  collectRenderDependencies(pin, context) {
    return null;
  }
  onActivate(pin, context) {}
  onDeactivate(pin, context) {}
  onFocus(pin, session) {}
  onUnfocus(pin, session) {}
  onTransmit(pin, event, context) {}
  onPointerDown(pin, event, session) {}
  onPointerMove(pin, event, session) {}
  onPointerUp(pin, event, session) {}
}
