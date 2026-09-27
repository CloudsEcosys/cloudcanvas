/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The other half of the bridge (`./adapt-trait.js` carries a class onto a
 * blit): a function trait's behaviour (`./trait.js`) as a legacy `PinTrait`
 * class, so a Pin runs the same code a core blit does.
 *
 * The class instance IS the behaviour's state record - `init(options)` is
 * assigned onto it - so `trait.dragging`, `trait.handles` and the rest read as
 * they always did. Each hook becomes the matching Pin hook, handed a
 * blit-shaped view of the Pin (`pinHandle`); the pointer hooks take the
 * session's projection, since on a Pin the session routes the pointer:
 *
 *   attach / detach   onAttach(pin) / onDetach(pin)
 *   press             onPointerDown(pin, event, session)
 *   move              onPointerMove(pin, event, session)
 *   release           onPointerUp(pin, event, session)
 *
 * `mount` is native-only and has no class counterpart. A class extends the
 * result with whatever only a Pin has.
 */
import { PIN_SIGNAL_TYPES, PinEvent, PinTrait, emitPinSignal } from '../pins/traits/base.js';

/** @type {WeakMap<object, object>} Pin (or carrier) -> its blit-shaped view */
const HANDLES = /* @__PURE__ */ new WeakMap();

/**
 * Resize a Pin: the inline size (with the card's max-width clamp lifted, or a
 * dragged-out width is silently capped), the particle (the next gesture reads
 * it now), and `invalidate('content')`, which re-measures and redraws what is
 * anchored to it. @returns {{width: number, height: number}}
 */
export function resizePin(pin, width, height) {
  const style = pin.element ? pin.element.style : null;
  if (style) {
    style.width = `${width}px`;
    style.height = `${height}px`;
    style.maxWidth = 'none';
  }
  pin.particle.setSize(width, height);
  pin.invalidate('content');
  return { width, height };
}

/**
 * Announce on a Pin: a lifecycle signal (`PIN_SIGNAL_TYPES`) as the manager
 * relays it, non-bubbling; anything else as a bubbling `PinEvent` whose detail
 * carries the payload's own keys too.
 */
function emitOnPin(pin, type, payload) {
  if (PIN_SIGNAL_TYPES.includes(type)) return emitPinSignal(pin, type, payload);
  const detail = payload && typeof payload === 'object' ? payload : null;
  return pin.dispatchEvent(new PinEvent(type, { source: pin, payload, detail }));
}

/** A new view: the blit surface a behaviour reads, answered live from the Pin. */
function createHandle(pin) {
  return {
    get el() { return pin.element; },
    get x() { return pin.particle.x; },
    get y() { return pin.particle.y; },
    get size() { return { w: pin.particle.width, h: pin.particle.height }; },
    get selected() { return Boolean(pin.selected); },
    set(patch) {
      if ('x' in patch || 'y' in patch) pin.setPosition(patch.x, patch.y);
      if ('w' in patch || 'h' in patch) resizePin(pin, patch.w, patch.h);
      return this;
    },
    emit(type, payload) { return emitOnPin(pin, type, payload); },
    on(type, listener) {
      pin.addEventListener(type, listener);
      return () => pin.removeEventListener(type, listener);
    }
  };
}

/** The blit-shaped view of a Pin (or a carrier), made once per Pin. */
export function pinHandle(pin) {
  let handle = HANDLES.get(pin);
  if (!handle) {
    handle = createHandle(pin);
    HANDLES.set(pin, handle);
  }
  return handle;
}

/** The session's projection as a behaviour's `env`, or null without a host and viewport. */
export function sessionEnv(session) {
  if (!session || !session.hostElement || !session.viewport) return null;
  return {
    point: (event) => session.viewport.screenToCanvas(event.clientX, event.clientY, session.hostElement.getBoundingClientRect())
  };
}

/**
 * A `PinTrait` class over a function trait's shared behaviour. The built-ins
 * pass the behaviour object itself (`dragBehaviour`), so a legacy bundle never
 * reaches the trait function or its native wiring. A hook the behaviour lacks
 * is the base class's no-op.
 * @param {Function|object} fn a trait made by `defineTrait`, or its behaviour
 * @param {string} name the registry name, fixed unless `renamable` (then `options.name` wins)
 * @param {{renamable?: boolean}} [flags]
 */
export function classFromTrait(fn, name, flags = {}) {
  const behaviour = fn && (fn.behaviour || fn);
  if (!behaviour || typeof behaviour.init !== 'function') {
    throw new TypeError(`classFromTrait: "${name}" has no behaviour; make it with defineTrait`);
  }
  const run = (hook, trait, pin, event, session) => (
    behaviour[hook] ? behaviour[hook](trait, pinHandle(pin), event, sessionEnv(session)) : undefined
  );

  return class extends PinTrait {
    constructor(options = {}) {
      super(options, { name: flags.renamable ? options.name || name : name, capabilities: behaviour.capabilities });
      Object.assign(this, behaviour.init(options));
    }

    onAttach(pin) { run('attach', this, pin); }

    onDetach(pin) { run('detach', this, pin); }

    onPointerDown(pin, event, session) { run('press', this, pin, event, session); }

    onPointerMove(pin, event, session) { run('move', this, pin, event, session); }

    onPointerUp(pin, event, session) { return run('release', this, pin, event, session); }
  };
}
