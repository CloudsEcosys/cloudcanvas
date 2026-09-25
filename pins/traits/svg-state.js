/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * SvgStateTrait: Manages discrete and parametric SVG vector states, 3D perspective
 * projection, and GPU-accelerated CSS transitions for Pins.
 */

import { PinTrait, PinEvent } from './base.js';
import { h, SVG_NS } from '../../graphics/primitives/element.js';
import { MOVING_CLASS } from '../../engine/motion-hint.js';
import { prefersReducedMotion } from '../../engine/viewport.js';
import { normalizePathTopology } from '../../graphics/vectorizer.js';

export const SVG_STATE_WRAPPER_CLASS = 'cloudcanvas-svg-state-wrapper';
export const SVG_STATE_HOST_CLASS = 'cloudcanvas-svg-state-host';
export const SVG_STATE_PATH_CLASS = 'cloudcanvas-svg-state-path';

/** Default transition duration in milliseconds */
export const DEFAULT_TRANSITION_DURATION = 350;

/** Default transition easing function */
export const DEFAULT_TRANSITION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

export class SvgStateTrait extends PinTrait {
  constructor(options = {}) {
    super(options, {
      name: options.name || 'svg-state',
      capabilities: ['svg-state', 'renderable', 'transformable-3d']
    });

    this.viewBox = options.viewBox || '0 0 200 200';
    this.perspective = Number(options.perspective) || 800;
    this.rx = Number(options.rx) || 0;
    this.ry = Number(options.ry) || 0;
    this.rz = Number(options.rz) || 0;
    this.depth = Number(options.depth) || 0;

    this.duration = typeof options.duration === 'number' ? options.duration : DEFAULT_TRANSITION_DURATION;
    this.easing = options.easing || DEFAULT_TRANSITION_EASING;
    this.normalizeSegments = typeof options.normalizeSegments === 'number' ? options.normalizeSegments : 0;
    this.bindVector = typeof options.bindVector === 'number' ? options.bindVector : null;

    /** Map of state names to normalized state definitions */
    this.states = new Map();

    const rawStates = options.states && typeof options.states === 'object' ? options.states : {};
    for (const [key, state] of Object.entries(rawStates)) {
      this.states.set(key, this._normalizeStateDef(state));
    }

    if (this.states.size === 0) {
      // Default baseline circle state
      const defaultPath = this.normalizeSegments > 0
        ? normalizePathTopology('', this.normalizeSegments, { cx: 100, cy: 100, defaultRadius: 50 })
        : 'M 100 50 A 50 50 0 1 0 100 150 A 50 50 0 1 0 100 50 Z';
      this.states.set('default', {
        d: defaultPath,
        fill: 'var(--cc-surface-2, rgba(56, 189, 248, 0.15))',
        stroke: 'var(--cc-accent, #38bdf8)',
        strokeWidth: 2,
        transform: 'none'
      });
    }

    const stateKeys = Array.from(this.states.keys());
    this.currentState = options.initialState && this.states.has(options.initialState)
      ? options.initialState
      : stateKeys[0];
  }

  /**
   * Normalize an incoming state definition and pre-align path topology if requested.
   */
  _normalizeStateDef(state) {
    if (!state || typeof state !== 'object') {
      return { d: '', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
    }

    let d = state.d || '';
    if (this.normalizeSegments > 0 && d) {
      d = normalizePathTopology(d, this.normalizeSegments, { cx: 100, cy: 100 });
    }

    return {
      d,
      fill: state.fill !== undefined ? state.fill : 'var(--cc-surface-2, rgba(56, 189, 248, 0.15))',
      stroke: state.stroke !== undefined ? state.stroke : 'var(--cc-accent, #38bdf8)',
      strokeWidth: state.strokeWidth !== undefined ? state.strokeWidth : 2,
      strokeDasharray: state.strokeDasharray || 'none',
      strokeDashoffset: state.strokeDashoffset !== undefined ? state.strokeDashoffset : 0,
      opacity: state.opacity !== undefined ? state.opacity : 1,
      transform: state.transform || 'none',
      filter: state.filter || '',
      bloom: state.bloom !== undefined ? state.bloom : false
    };
  }

  /**
   * Mount the 3D perspective wrapper and SVG element inside the Pin's content element.
   */
  onAttach(pin) {
    const content = pin.contentElement || (pin.getContentElement ? pin.getContentElement() : null);
    if (!content) return;

    // Build the DOM tree with h()
    const pathNode = h('path', {
      class: SVG_STATE_PATH_CLASS,
      'vector-effect': 'non-scaling-stroke'
    });

    const defsNode = h('defs', {});

    const svgNode = h('svg', {
      class: SVG_STATE_HOST_CLASS,
      viewBox: this.viewBox,
      preserveAspectRatio: 'xMidYMid meet'
    }, [defsNode, pathNode]);

    const wrapper = h('div', {
      class: SVG_STATE_WRAPPER_CLASS,
      style: `perspective: ${this.perspective}px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: visible;`
    }, [svgNode]);

    content.appendChild(wrapper);

    const bindings = {
      wrapper,
      svg: svgNode,
      defs: defsNode,
      path: pathNode,
      cleanupTimer: null
    };

    pin._svgStateBindings = bindings;

    // Setup transition lifecycle events on the path element
    const onTransitionEnd = () => {
      this._clearCompositorHint(pin);
      pin.dispatchEvent(new PinEvent('svg:transitionend', {
        source: pin,
        payload: { state: this.currentState },
        detail: { state: this.currentState }
      }));
    };

    pathNode.addEventListener('transitionend', onTransitionEnd);
    bindings._onTransitionEnd = onTransitionEnd;

    // Initial render of current state and 3D transform
    this._applyStateToDOM(pin, this.currentState, true);
    this.setTransform3D(pin, { rx: this.rx, ry: this.ry, rz: this.rz, depth: this.depth });
  }

  /**
   * Teardown DOM and listeners on trait detach.
   */
  onDetach(pin) {
    const bindings = pin._svgStateBindings;
    if (!bindings) return;

    if (bindings.cleanupTimer) {
      clearTimeout(bindings.cleanupTimer);
      bindings.cleanupTimer = null;
    }

    if (bindings.path && bindings._onTransitionEnd) {
      bindings.path.removeEventListener('transitionend', bindings._onTransitionEnd);
    }

    if (bindings.wrapper && bindings.wrapper.parentNode) {
      bindings.wrapper.parentNode.removeChild(bindings.wrapper);
    }

    this._clearCompositorHint(pin);
    pin._svgStateBindings = null;
  }

  /**
   * Set 3D perspective orientation on the SVG host.
   */
  setTransform3D(pin, { rx, ry, rz, depth } = {}) {
    if (rx !== undefined) this.rx = Number(rx) || 0;
    if (ry !== undefined) this.ry = Number(ry) || 0;
    if (rz !== undefined) this.rz = Number(rz) || 0;
    if (depth !== undefined) this.depth = Number(depth) || 0;

    const bindings = pin._svgStateBindings;
    if (!bindings || !bindings.svg) return;

    const transform3d = `translateZ(${this.depth}px) rotateX(${this.rx}deg) rotateY(${this.ry}deg) rotateZ(${this.rz}deg)`;
    bindings.svg.style.transform = transform3d;
  }

  /**
   * Smoothly transition to a named vector state using CSS transitions and GPU compositing.
   *
   * @param {Pin} pin
   * @param {string} stateName Target state key
   * @param {Object} [options]
   * @param {number} [options.duration] Override transition duration
   * @param {string} [options.easing] Override transition easing
   * @param {boolean} [options.immediate=false] Skip transition if true
   * @returns {boolean} True if transition was initiated
   */
  transitionTo(pin, stateName, options = {}) {
    if (!this.states.has(stateName)) return false;

    const previousState = this.currentState;
    this.currentState = stateName;

    const immediate = options.immediate || prefersReducedMotion();
    this._applyStateToDOM(pin, stateName, immediate, options);

    const eventPayload = {
      from: previousState,
      to: stateName,
      state: this.states.get(stateName)
    };

    pin.dispatchEvent(new PinEvent('svg:statechange', {
      source: pin,
      payload: eventPayload,
      detail: eventPayload
    }));

    return true;
  }

  /**
   * Directly morph the current SVG path geometry with a new path string.
   */
  applyContour(pin, pathData, options = {}) {
    const bindings = pin._svgStateBindings;
    if (!bindings || !bindings.path) return;

    let d = pathData;
    if (this.normalizeSegments > 0) {
      d = normalizePathTopology(d, this.normalizeSegments, { cx: 100, cy: 100 });
    }

    const immediate = options.immediate || prefersReducedMotion();
    if (!immediate) {
      this._grantCompositorHint(pin);
    }

    bindings.path.setAttribute('d', d);
    bindings.path.style.d = `path("${d}")`;
  }

  /**
   * Apply a state's presentation properties to the DOM nodes.
   */
  _applyStateToDOM(pin, stateName, immediate = false, options = {}) {
    const bindings = pin._svgStateBindings;
    if (!bindings || !bindings.path) return;

    const state = this.states.get(stateName);
    if (!state) return;

    const path = bindings.path;
    const duration = typeof options.duration === 'number' ? options.duration : this.duration;
    const easing = options.easing || this.easing;

    if (immediate) {
      path.style.transition = 'none';
      this._clearCompositorHint(pin);
    } else {
      path.style.transition = `d ${duration}ms ${easing}, transform ${duration}ms ${easing}, fill ${duration}ms ease, stroke ${duration}ms ease, stroke-width ${duration}ms ease, filter ${duration}ms ease`;
      this._grantCompositorHint(pin);

      // Fallback cleanup timer in case transitionend does not fire
      if (bindings.cleanupTimer) clearTimeout(bindings.cleanupTimer);
      bindings.cleanupTimer = setTimeout(() => {
        this._clearCompositorHint(pin);
        bindings.cleanupTimer = null;
      }, duration + 80);
    }

    if (state.d) {
      path.setAttribute('d', state.d);
      // CSS path property for C++ compositor interpolation
      path.style.d = `path("${state.d}")`;
    }

    path.setAttribute('fill', state.fill);
    path.setAttribute('stroke', state.stroke);
    path.setAttribute('stroke-width', String(state.strokeWidth));
    path.setAttribute('stroke-dasharray', state.strokeDasharray);
    path.setAttribute('stroke-dashoffset', String(state.strokeDashoffset));
    path.setAttribute('opacity', String(state.opacity));

    if (state.transform && state.transform !== 'none') {
      path.style.transform = state.transform;
    } else {
      path.style.transform = '';
    }

    // Bloom & Filter integration
    let filterString = state.filter || '';
    if (state.bloom) {
      const bloomIntensity = typeof state.bloom === 'number' ? state.bloom : 1;
      const bloomFilter = `drop-shadow(0 0 ${4 * bloomIntensity}px ${state.stroke}) drop-shadow(0 0 ${12 * bloomIntensity}px ${state.fill})`;
      filterString = filterString ? `${filterString} ${bloomFilter}` : bloomFilter;
    }
    path.style.filter = filterString;
  }

  /**
   * Grant GPU compositor layer hint to pin element.
   */
  _grantCompositorHint(pin) {
    if (pin.element && pin.element.classList) {
      pin.element.classList.add(MOVING_CLASS);
    }
  }

  /**
   * Retire GPU compositor layer hint from pin element to avoid VRAM leaks.
   */
  _clearCompositorHint(pin) {
    if (pin.element && pin.element.classList) {
      pin.element.classList.remove(MOVING_CLASS);
    }
  }

  /**
   * Frame tick handler: optionally maps bound particle vectors to 3D rotation or state.
   */
  onTick(pin, dt, context) {
    if (this.bindVector === null || !pin.particle || !pin.particle.vectors) return;

    const val = pin.particle.getVector(this.bindVector);
    if (typeof val === 'number') {
      // Map float vector to 3D tilt
      this.ry = (val * 45) % 360;
      this.setTransform3D(pin, { ry: this.ry });
    }
  }
}
