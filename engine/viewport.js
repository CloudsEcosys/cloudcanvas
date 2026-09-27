/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Viewport manages canvas coordinate transformations, zoom levels, pan offsets,
 * smooth camera animations, and focus framing.
 *
 * The camera is the core's (`../core/camera.js`) with the motion add-on's
 * eased moves, projection and reduced-motion rule on top
 * (`../addons/motion.js`). This class keeps the session-era names:
 * `zoomToFit` (the fit under its old name), `focusOn`, `getTransformString`
 * and `reset`.
 */
import { MotionCamera } from '../addons/motion.js';
import { formatTransform3D } from '../graphics/styles.js';

/** The easing table, its default, and the reduced-motion query live in the motion add-on. */
export {
  EASINGS,
  DEFAULT_EASING,
  prefersReducedMotion,
  _resetReducedMotionForTests
} from '../addons/motion.js';

export class Viewport extends MotionCamera {
  /**
   * Frame a box: the one camera fit, under the name that says what it does.
   *
   * Two things it gives a caller beyond the raw fit:
   *
   *   - the box may be written any of the three ways a box is written in this
   *     codebase (`{minX,minY,maxX,maxY}`, `{x,y,width,height}`, a DOMRect-like
   *     `{left,top,right,bottom}`), because the caller computing a union of Pin
   *     bounds should not have to know which one the camera prefers
   *   - it returns the camera it resolved, so a caller can frame a box without
   *     waiting for the animation to tell them where it went
   *
   * The session-level ergonomics (`session.zoomToFit()` over a set of Pins, or
   * over everything) live at the session layer and call through to here.
   *
   * @param {object} bounds
   * @param {{width: number, height: number}} [hostRect]
   * @param {object} [options]
   * @param {number} [options.padding=60] screen-pixel clearance on every side
   * @param {number} [options.maxZoom=2.5] ceiling on the resolved scale, so
   *        framing one small Pin does not fill the host with it
   * @param {boolean} [options.immediate] jump instead of animating
   * @param {number} [options.duration=400] animation length in milliseconds
   * @param {((t: number) => number)|string} [options.easing]
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   * @throws {TypeError} when `bounds` describes no box at all
   */
  zoomToFit(bounds, hostRect, options) {
    return this.fit(bounds, hostRect, options);
  }

  /**
   * @deprecated since 0.3.0 - use {@link Viewport#zoomToFit}. Removed in 0.4.0.
   *
   * Identical maths through the identical choke point, with the same arguments;
   * `zoomToFit` additionally reads all three box shapes and returns the camera
   * it resolved. One behavioural difference comes with the alias: a box that
   * describes no box at all now throws a `TypeError` instead of quietly flying
   * the camera to the origin.
   *
   * @param {object} bounds
   * @param {{width: number, height: number}} [hostRect]
   * @param {object} [options]
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   */
  focusOn(bounds, hostRect, options) {
    return this.zoomToFit(bounds, hostRect, options);
  }

  /**
   * Produce the CSS transform string for the viewport plane
   */
  getTransformString() {
    return formatTransform3D(this.x, this.y, 0, this.scale);
  }

  /**
   * Reset viewport to default origin and scale
   */
  reset(options = {}) {
    if (options.animate || (options.duration && !options.immediate)) {
      this.animateTo(0, 0, 1, { duration: options.duration || 350, easing: options.easing });
    } else {
      this.stopAnimation();
      this.x = 0;
      this.y = 0;
      this.scale = 1;
      this._wake();
    }
  }
}
