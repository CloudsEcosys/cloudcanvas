/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * SvgStateTrait: the svgState add-on (`../../addons/svg-state.js`) on a Pin -
 * discrete and parametric SVG vector states, 3D orientation and GPU-composited
 * transitions, all living there once. What stays here is the Pin's: the DOM
 * goes in its content element (its bindings mirrored as `pin._svgStateBindings`),
 * and `bindVector` maps a particle vector to the tilt - read in the tick,
 * written in the render, never a style write in the read phase.
 */
import { classFromTrait, pinHandle } from '../../addons/class-from-trait.js';
import {
  applyContour,
  mountSvgState,
  setOrientation,
  svgStateBehaviour,
  transitionState,
  unmountSvgState
} from '../../addons/svg-state.js';

export {
  DEFAULT_TRANSITION_DURATION,
  DEFAULT_TRANSITION_EASING,
  SVG_STATE_HOST_CLASS,
  SVG_STATE_PATH_CLASS,
  SVG_STATE_WRAPPER_CLASS
} from '../../addons/svg-state.js';

export class SvgStateTrait extends classFromTrait(svgStateBehaviour, 'svg-state', { renamable: true }) {
  /** Mount the perspective wrapper and SVG inside the Pin's content element. */
  onAttach(pin) {
    const content = pin.contentElement || (pin.getContentElement ? pin.getContentElement() : null);
    if (!content) return;
    pin._svgStateBindings = mountSvgState(this, pinHandle(pin), content);
  }

  /** Tear the DOM and its listener down. */
  onDetach(pin) {
    if (!pin._svgStateBindings) return;
    unmountSvgState(this, pinHandle(pin));
    pin._svgStateBindings = null;
  }

  /** Set the 3D orientation on the SVG host. */
  setTransform3D(pin, rotation = {}) {
    setOrientation(this, rotation);
  }

  /**
   * Transition to a named state (`duration`, `easing`, `immediate` override).
   * @returns {boolean} true if the transition was initiated
   */
  transitionTo(pin, stateName, options = {}) {
    return transitionState(this, pinHandle(pin), stateName, options);
  }

  /** Morph the path to raw path data. */
  applyContour(pin, pathData, options = {}) {
    applyContour(this, pinHandle(pin), pathData, options);
  }

  /** Read phase: map the bound particle vector to a tilt, and ask for the write. */
  onTick(pin, dt, context) {
    if (this.bindVector === null || !pin.particle || !pin.particle.vectors) return;
    const value = pin.particle.getVector(this.bindVector);
    if (typeof value !== 'number') return;

    const ry = (value * 45) % 360;
    if (ry === this.ry) return;
    this.ry = ry;
    this._orientationDirty = true;
    pin.invalidate('content');
  }

  /** Write phase: apply the tilt `onTick` computed, once. */
  onRender(pin) {
    if (!this._orientationDirty) return;
    this._orientationDirty = false;
    setOrientation(this, { ry: this.ry });
  }
}
