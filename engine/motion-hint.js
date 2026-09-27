/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The compositor hint, and why it is not a stylesheet rule.
 *
 * `will-change: transform` is a promise to keep a GPU layer alive. Declared on
 * `.cloudcanvas-pin` it is a promise made about *every* Pin on the canvas,
 * forever - a thousand stationary cards, a thousand promoted layers, and a
 * memory profile that has nothing to do with what is moving. Declared on a class
 * the renderer grants and withdraws, it costs exactly what is in motion.
 *
 * Withdrawal is delayed rather than immediate: a Pin between two drag steps, or
 * on the flat part of an eased camera move, is still-but-not-finished, and
 * dropping the layer there is the jank the hint exists to prevent.
 */

import { MOVING_CLASS } from '../addons/motion.js';

/** Class the renderer adds while a Pin moves; owned by `../addons/motion.js`. */
export { MOVING_CLASS };

/**
 * Still frames a Pin must go through before its hint is withdrawn. Half a
 * second at 60Hz: long enough to span a gap in a gesture, short enough that a
 * settled canvas holds no promoted layers at all.
 */
export const MOVING_IDLE_FRAMES = 30;

/** Pins currently carrying the hint, against the frame each last moved. */
export class MotionHintSet {
  constructor(idleFrames = MOVING_IDLE_FRAMES) {
    this.idleFrames = idleFrames;
    /** @type {Map<Pin, number>} */
    this._moving = new Map();
  }

  get size() {
    return this._moving.size;
  }

  has(pin) {
    return this._moving.has(pin);
  }

  /** Promise the compositor a layer for as long as this Pin keeps moving. */
  mark(pin, frameCount) {
    if (!this._moving.has(pin) && pin.element && pin.element.classList) {
      pin.element.classList.add(MOVING_CLASS);
    }
    this._moving.set(pin, frameCount);
    return true;
  }

  /**
   * Withdraw the hint from every Pin that has been still long enough. Only Pins
   * that moved recently are visited, so a static canvas pays nothing for this.
   *
   * @returns {number} how many hints were withdrawn
   */
  sweep(frameCount) {
    if (this._moving.size === 0) return 0;

    let swept = 0;
    for (const [pin, lastFrame] of this._moving) {
      if (frameCount - lastFrame < this.idleFrames) continue;
      if (pin.element && pin.element.classList) pin.element.classList.remove(MOVING_CLASS);
      this._moving.delete(pin);
      swept += 1;
    }
    return swept;
  }

  delete(pin) {
    return this._moving.delete(pin);
  }

  clear() {
    this._moving.clear();
  }
}
