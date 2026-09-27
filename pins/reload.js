/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Reload policy: the pure, side-effect-free rules that decide what happens to a
 * Pin's element when it - or the scope above it - stops being active.
 *
 * Nothing here touches the DOM or a Pin's state. `Pin` applies these decisions
 * synchronously when it has no renderer; `ConjugateRenderer` applies them in
 * its structure flush when it does. Keeping the policy separate is what lets
 * both paths agree by construction.
 */

/** Class marking a mounted-but-hidden Pin (`display: none`); measurement is skipped. */
export const DORMANT_CLASS = 'is-dormant';

/**
 * How a Pin behaves when it - or the scope above it - stops being active.
 *
 *  - `active`     : unmounted from the DOM (instance, traits, contents, particle
 *                   state all retained) and remounted on reactivation.
 *  - `persistent` : stays mounted, hidden via `.is-dormant`, out of the render
 *                   loop (no ticks, no content work, no measurement).
 *  - `lazy`       : absent until first required; children are provisioned by the
 *                   `loadChildren` provider at that point. Once provisioned it
 *                   behaves like `persistent` until `unload()` resets it.
 */
export const RELOAD_STRATEGIES = /* @__PURE__ */ Object.freeze({
  ACTIVE: 'active',
  PERSISTENT: 'persistent',
  LAZY: 'lazy'
});

const RELOAD_VALUES = /* @__PURE__ */ new Set(/* @__PURE__ */ Object.values(RELOAD_STRATEGIES));

/** The DOM states a reload strategy can resolve to. */
export const RELOAD_MODES = /* @__PURE__ */ Object.freeze({
  MOUNTED: 'mounted',
  DORMANT: 'dormant',
  UNMOUNTED: 'unmounted'
});

/**
 * Validate a reload strategy, falling back when none was declared.
 * @throws {TypeError} on an unknown strategy - a typo must never silently
 *                     downgrade a Pin to a different lifecycle.
 */
export function normalizeReloadStrategy(value, fallback = RELOAD_STRATEGIES.ACTIVE) {
  if (value === undefined || value === null) return fallback;
  if (!RELOAD_VALUES.has(value)) {
    throw new TypeError(
      `Unknown reload strategy "${value}"; expected one of ${Array.from(RELOAD_VALUES).join(', ')}`
    );
  }
  return value;
}

/** Resolve construction options to a reload strategy, honouring the `lazy` alias. */
export function reloadFromOptions(options = {}) {
  if (options.reload !== undefined && options.reload !== null) {
    return normalizeReloadStrategy(options.reload);
  }
  if (options.lazy !== undefined) {
    return options.lazy ? RELOAD_STRATEGIES.LAZY : RELOAD_STRATEGIES.ACTIVE;
  }
  return RELOAD_STRATEGIES.ACTIVE;
}

/**
 * The DOM state a Pin should be in, derived purely from its own lifecycle flags.
 *
 * Deactivation cascades down the scope tree, so a Pin under a dormant or
 * unmounted ancestor is itself inactive: no ancestor walk is needed here.
 *
 * @returns {'mounted'|'dormant'|'unmounted'}
 */
export function resolveReloadMode(pin) {
  return resolveRenderMode(pin, true);
}

/**
 * The DOM state a Pin should be in given both its own lifecycle flags and
 * whether the current render root lets it take part at all.
 *
 * A Pin outside the render root is demoted to exactly the resting state its
 * strategy prescribes for an inactive Pin - which is why root promotion needs
 * no rules of its own: `participating: false` is indistinguishable, policy-wise,
 * from `active: false`.
 *
 * Offload is a second, orthogonal reason to leave the document, decided by the
 * viewport rather than the scope tree (see `../engine/offload.js`): a Pin whose
 * global box has left the visible canvas carries `_offloadDormant`, and is
 * detached regardless of how active it is. It short-circuits *before* the active
 * check for exactly that reason - an offloaded Pin is still live in every sense
 * but its DOM membership, and reattaches with all of its state intact.
 *
 * @param {Pin} pin
 * @param {boolean} participating - false when the render root excludes this Pin
 * @returns {'mounted'|'dormant'|'unmounted'}
 */
export function resolveRenderMode(pin, participating = true) {
  if (!pin) return RELOAD_MODES.UNMOUNTED;
  if (pin._offloadDormant) return RELOAD_MODES.UNMOUNTED;
  if (participating && pin.active) return RELOAD_MODES.MOUNTED;

  switch (pin.reload) {
    case RELOAD_STRATEGIES.PERSISTENT:
      return RELOAD_MODES.DORMANT;
    case RELOAD_STRATEGIES.LAZY:
      return pin._provisioned ? RELOAD_MODES.DORMANT : RELOAD_MODES.UNMOUNTED;
    default:
      return RELOAD_MODES.UNMOUNTED;
  }
}

/**
 * Whether a child wakes when its parent scope wakes.
 *
 * Everything does, except a lazy Pin that has never been required: those are
 * provisioned on their own first activation or focus, not by a parent's. A lazy
 * Pin that *has* been required behaves like a persistent one from then on.
 */
export function wakesWithParent(pin) {
  return pin.reload !== RELOAD_STRATEGIES.LAZY || Boolean(pin._provisioned);
}
