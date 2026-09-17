/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * PinSignalBus: the one route by which state changes inside a Pin reach an
 * observer outside it.
 *
 * A Pin is an EventTarget, but its events never cross into another Pin, so a
 * listener would otherwise have to be attached Pin by Pin by every interested
 * party. Instead the PinManager - the only component that knows every Pin -
 * attaches one listener per Pin per signal type, and re-broadcasts to whoever
 * subscribed here. Today that is the session, turning `activate` / `select` into
 * cursor targets and `destroy` into their release.
 *
 * The bus carries the native `PinEvent` untouched: `event.type` is the signal,
 * `event.detail.source` is the Pin, `event.payload` is the new state.
 */
import { PIN_SIGNAL_TYPES } from './traits/base.js';

export class PinSignalBus {
  constructor(types = PIN_SIGNAL_TYPES) {
    /** @type {readonly string[]} the signal types this bus relays */
    this.types = types;

    /** @type {Set<(event: PinEvent) => void>} */
    this.handlers = new Set();

    // One listener object for every Pin and every type: re-attaching it is a
    // no-op, and detaching one Pin never disturbs another.
    this._forward = (event) => {
      const source = event && event.detail ? event.detail.source : (event ? event.target : null);
      if (event && event.currentTarget && source && event.currentTarget !== source) {
        return;
      }
      for (const handler of this.handlers) handler(event);
    };
  }

  /**
   * Observe every relayed signal.
   * @returns {() => boolean} unsubscribe
   */
  subscribe(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('PinSignalBus.subscribe: handler must be a function');
    }
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Start relaying a Pin's signals. */
  attach(pin) {
    return this._listen(pin, true);
  }

  /** Stop relaying a Pin's signals. */
  detach(pin) {
    return this._listen(pin, false);
  }

  _listen(pin, listening) {
    if (!pin || typeof pin.addEventListener !== 'function') return false;
    for (const type of this.types) {
      if (listening) pin.addEventListener(type, this._forward);
      else pin.removeEventListener(type, this._forward);
    }
    return true;
  }

  /** Drop every subscriber. Pins keep their listeners; the bus has no audience. */
  clear() {
    this.handlers.clear();
  }
}
