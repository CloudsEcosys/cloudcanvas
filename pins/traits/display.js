/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * DisplayTrait: DOM representation of a Pin's Contents Map across card, vector, media, and raw modes.
 *
 * Rendering is a build/update split, not a re-stringify:
 *   - the first render for a display type builds the subtree once and keeps live
 *     node references on `pin._display.bindings`
 *   - every later render mutates text nodes, attributes, and only those SVG slots
 *     whose inputs changed (tracked in `pin._display.cache`)
 *
 * Two consequences the rest of the engine depends on: node identity inside a Pin's
 * content element is stable across frames, and content values are escaped by the DOM
 * itself. The one markup opt-in is the `html` content key (`raw`, or a `card` override).
 */

import {
  DISPLAY_TEMPLATES,
  DEFAULT_TEMPLATE,
  HTML_TEMPLATE,
  usesHtmlOverride
} from './display-templates.js';
import { PinTrait } from './base.js';

export class DisplayTrait extends PinTrait {
  constructor(options = {}) {
    // Name stays caller-overridable: display traits are the Pin's declared type.
    super(options, {
      name: options.name || 'display',
      capabilities: ['renderable']
    });
    this.displayType = options.displayType || 'card';
    this.allowedKeys = options.allowedKeys ? new Set(options.allowedKeys) : null;

    // Opaque mode: the caller owns the content element outright.
    this.customRenderer = typeof options.render === 'function' ? options.render : null;

    // Template mode: a caller-supplied build/update pair joins the same
    // build-once/mutate-after contract and outranks an opaque renderer.
    this.customTemplate = (typeof options.build === 'function' && typeof options.update === 'function')
      ? { build: options.build, update: options.update, dispose: options.dispose }
      : null;

    // PinTrait accepts an instance onDetach option. Wrap it so that a caller's
    // hook cannot bypass component cleanup, and preserve its existing behavior.
    const onDetach = this.onDetach;
    this.onDetach = (pin, reason = 'detach') => {
      this.discardBuild(pin, reason);
      if (onDetach !== PinTrait.prototype.onDetach) onDetach.call(this, pin, reason);
    };
  }

  validate(contentsMap) {
    if (!contentsMap || !(contentsMap instanceof Map)) {
      return { valid: false, error: 'Contents must be an instance of Map' };
    }
    if (this.allowedKeys) {
      for (const key of contentsMap.keys()) {
        if (!this.allowedKeys.has(key)) {
          return { valid: false, error: `Key "${key}" not permitted for DisplayTrait "${this.name}"` };
        }
      }
    }
    return { valid: true };
  }

  /**
   * Render this Pin's contents into its content element.
   *
   * @param {Pin} pin
   * @param {Map<string, *>} contents
   * @param {Element} element the Pin's `.cloudcanvas-pin-content` node
   * @returns {Object|*} the Pin's display state, or the custom renderer's return value
   */
  onRender(pin, contents, element, context) {
    if (!element) return null;
    if (!this.customTemplate && this.customRenderer) {
      return this.customRenderer(pin, contents, element, context);
    }

    const template = this._templateFor(contents);
    const state = this._ensureBuilt(pin, contents, element, template);
    template.update(pin, contents, state.bindings, state.cache);
    return state;
  }

  /** The template this render pass must run: custom pair, markup override, or type table. */
  _templateFor(contents) {
    if (this.customTemplate) return this.customTemplate;
    if (usesHtmlOverride(this.displayType, contents)) return HTML_TEMPLATE;
    return DISPLAY_TEMPLATES[this.displayType] || DEFAULT_TEMPLATE;
  }

  /**
   * Return the Pin's display state, building the subtree first when it is missing
   * or no longer describes what this render needs.
   *
   * A rebuild is triggered by exactly three transitions: no state yet, a display
   * type swap, and the `html` override appearing or disappearing (which is a
   * different subtree shape, not a different value). The content element is
   * compared too, so bindings can never address a replaced node.
   */
  _ensureBuilt(pin, contents, element, template) {
    const signature = this._signature(contents);
    const state = pin._display;

    if (state && state.type === signature && state.element === element) {
      return state;
    }

    if (state) {
      const owner = state.owner || this;
      owner.discardBuild(pin, 'rebuild');
    }

    const built = {
      type: signature,
      element,
      bindings: template.build(pin, element),
      cache: {},
      owner: this
    };
    pin._display = built;
    return built;
  }

  /** Identity of the built subtree: display type plus markup-override mode. */
  _signature(contents) {
    const base = this.customTemplate ? `custom:${this.name}` : this.displayType;
    return usesHtmlOverride(this.displayType, contents) && !this.customTemplate
      ? `${base}+html`
      : base;
  }

  /**
   * Throw away the built subtree so the next render rebuilds it from scratch.
   *
   * The rebuild in `_ensureBuilt` fires on a *signature* change - a type swap or
   * the html override appearing - because those are the only structure changes the
   * built-in templates have: a card is always title-over-body, whatever the values.
   * A `defineComponent` template whose `build` reads the content *shape* (the
   * slotted type builds one region per slot, one line per field) has a fourth kind
   * of change the signature cannot see, since the trait name it keys on is fixed.
   * This is the deliberate escape hatch for exactly that: after rewriting such a
   * Pin's contents to a different shape, discarding the build is what makes the
   * next frame lay out the new regions instead of writing into the old ones.
   *
   * Owned here rather than reached at from outside because `pin._display` is this
   * trait's private render state; `Pin.rebuildDisplay` is the public spelling.
   */
  discardBuild(pin, reason = 'rebuild') {
    const state = pin?._display;
    if (!state || (state.owner && state.owner !== this)) return;
    pin._display = null;
    if (state.owner === this) {
      const dispose = this.customTemplate?.dispose;
      if (typeof dispose === 'function') dispose(pin, state.bindings, reason);
    }
  }
}
