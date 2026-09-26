/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pin-to-Pin reactions: "when Pin A emits signal X, run action Y on Pin B",
 * wired visually and stored beside the session rather than on either Pin.
 *
 * A binding names two Pins, so it can outlive neither being the "owner": it is
 * session state, and lives in a {@link ReactionStore} the session reaches through
 * a WeakMap ({@link reactionsFor}). The runner listens on the *one* signal
 * surface the codebase already has - `session.pinManager.onSignal`, the same
 * re-broadcast of every Pin's `emitPinSignal` the cursor system rides - so a
 * reaction observes a Pin exactly the way any other listener does, and there is
 * no second dispatch mechanism to keep in step.
 *
 * ORPHANS. A Pin can be deleted while a binding still names it. Two things then
 * happen, and both are deliberate: the runner sees the Pin's `destroy` signal and
 * prunes every binding that referenced it (so a deleted Pin leaves no dead
 * bindings behind), and - as a belt-and-braces for any reference that outran a
 * prune - a binding whose target no longer resolves is silently skipped at run
 * time rather than throwing. A binding is never run against a Pin that is gone.
 */

import { PIN_SIGNAL_TYPES } from './traits/base.js';
import { actionRegistry as defaultActionRegistry } from './reaction-actions.js';
import { createLogger } from '../log.js';

const logger = createLogger('reactions');

/** The signal a binding may fire on; the same closed set the bus relays. */
const SIGNAL_SET = new Set(PIN_SIGNAL_TYPES);

/** A short, collision-unlikely binding id. */
function freshId() {
  return `rx_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The bindings for one session: create, delete, look up by source, and the
 * pruning a deleted Pin triggers. Registry-aware, so every stored binding names
 * a real action with parameters the action accepts.
 */
export class ReactionStore {
  constructor(registry = defaultActionRegistry) {
    this.registry = registry;
    /** @type {Map<string, object>} id -> binding, iteration order is insertion order */
    this._bindings = new Map();
  }

  /**
   * Add a binding, validating its signal and its action's parameters.
   *
   * @param {{id?: string, sourcePinId: string, signal: string,
   *   action: {type: string, targetPinId: string, params?: object}}} binding
   * @returns {object} the stored, normalized binding
   * @throws {TypeError} on a bad signal, unknown action, or invalid parameters
   */
  add(binding) {
    const normalized = this._normalize(binding);
    this._bindings.set(normalized.id, normalized);
    return normalized;
  }

  /** Normalize and validate a binding without storing it. */
  _normalize(binding) {
    const source = binding && typeof binding === 'object' ? binding : {};
    const action = source.action && typeof source.action === 'object' ? source.action : {};

    if (typeof source.sourcePinId !== 'string' || source.sourcePinId === '') {
      throw new TypeError('ReactionStore.add: a sourcePinId is required');
    }
    if (!SIGNAL_SET.has(source.signal)) {
      throw new TypeError(`ReactionStore.add: "${source.signal}" is not a Pin signal`);
    }
    if (typeof action.targetPinId !== 'string' || action.targetPinId === '') {
      throw new TypeError('ReactionStore.add: an action.targetPinId is required');
    }

    const result = this.registry.validate(action.type, action.params);
    if (!result.valid) throw new TypeError(`ReactionStore.add: ${result.error}`);

    return {
      id: typeof source.id === 'string' && source.id ? source.id : freshId(),
      sourcePinId: source.sourcePinId,
      signal: source.signal,
      action: { type: action.type, targetPinId: action.targetPinId, params: result.params }
    };
  }

  remove(id) {
    return this._bindings.delete(id);
  }

  get(id) {
    return this._bindings.get(id);
  }

  /** Every binding, in insertion order. */
  all() {
    return Array.from(this._bindings.values());
  }

  /** Every binding fired by a Pin, whatever the signal. */
  forSource(pinId) {
    return this.all().filter((binding) => binding.sourcePinId === pinId);
  }

  /** The bindings a given signal on a given Pin should run. */
  matching(pinId, signal) {
    return this.all().filter((binding) => binding.sourcePinId === pinId && binding.signal === signal);
  }

  /** Whether any binding names this Pin as either end. */
  references(pinId) {
    return this.all().some((binding) => binding.sourcePinId === pinId || binding.action.targetPinId === pinId);
  }

  /**
   * Drop every binding that names this Pin as source or target.
   * @returns {number} how many bindings were removed
   */
  pruneForPin(pinId) {
    let removed = 0;
    for (const [id, binding] of this._bindings) {
      if (binding.sourcePinId === pinId || binding.action.targetPinId === pinId) {
        this._bindings.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  clear() {
    this._bindings.clear();
  }

  /** Every binding as a plain, JSON-safe object (the serialization surface). */
  toJSON() {
    return this.all().map((binding) => ({
      id: binding.id,
      sourcePinId: binding.sourcePinId,
      signal: binding.signal,
      action: {
        type: binding.action.type,
        targetPinId: binding.action.targetPinId,
        params: { ...binding.action.params }
      }
    }));
  }

  /**
   * Replace the store's contents from a persisted list.
   *
   * Clears first, so loading a saved canvas over a live one is a replace, not a
   * merge - the same semantics `clearCanvas` gives the Pins themselves. A binding
   * that fails validation, or (given `pinExists`) names a Pin that did not come
   * back, is skipped with a warning rather than thrown: a canvas that restores
   * nine bindings out of ten is worth more than one that restores none.
   *
   * @param {object[]} list
   * @param {{pinExists?: (id: string) => boolean, warn?: (message: string) => void}} [options]
   * @returns {string[]} the warnings collected
   */
  load(list, options = {}) {
    this.clear();
    const warnings = [];
    const exists = typeof options.pinExists === 'function' ? options.pinExists : null;
    const warn = (message) => { warnings.push(message); if (options.warn) options.warn(message); };

    for (const raw of Array.isArray(list) ? list : []) {
      const bad = exists ? this._danglingEnd(raw, exists) : null;
      if (bad) { warn(`reaction skipped: ${bad}`); continue; }
      try {
        this.add(raw);
      } catch (error) {
        logger.debug('reaction skipped on load', error);
        warn(`reaction skipped: ${error.message}`);
      }
    }
    return warnings;
  }

  /** The description of a missing endpoint, or null when both resolve. */
  _danglingEnd(raw, exists) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const action = source.action && typeof source.action === 'object' ? source.action : {};
    if (source.sourcePinId && !exists(source.sourcePinId)) return `source pin "${source.sourcePinId}" is gone`;
    if (action.targetPinId && !exists(action.targetPinId)) return `target pin "${action.targetPinId}" is gone`;
    return null;
  }
}

/**
 * The runner: turns the session's Pin signals into action runs.
 *
 * One subscription on `session.pinManager.onSignal` for the whole session, not
 * one listener per binding: the bus already fans every Pin's signals into that
 * one callback, so a binding added or removed changes a lookup, never a
 * subscription.
 */
export class ReactionRunner {
  constructor(session, store, registry = defaultActionRegistry) {
    this.session = session;
    this.store = store;
    this.registry = registry;
    this._unsubscribe = null;
    this._onSignal = this._onSignal.bind(this);
  }

  /** Begin observing the session's Pin signals. Idempotent. */
  attach() {
    if (this._unsubscribe) return this;
    this._unsubscribe = this.session.pinManager.onSignal(this._onSignal);
    return this;
  }

  /** Stop observing. */
  detach() {
    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = null;
    return this;
  }

  /** One relayed Pin signal: prune on a death, otherwise run what it fires. */
  _onSignal(event) {
    const source = event && event.detail ? event.detail.source : null;
    if (!source || source.utility) return;

    if (event.type === 'destroy') {
      this.store.pruneForPin(source.id);
      return;
    }

    const bindings = this.store.matching(source.id, event.type);
    for (const binding of bindings) this._run(binding, source, event);
  }

  /**
   * Run one binding's action against its target, if the target still exists.
   *
   * A missing target is the runtime orphan case: skipped, never thrown. A `run`
   * that itself throws is contained to its own binding, so one broken action
   * cannot take the bus - or the next binding on the same signal - down with it.
   */
  _run(binding, source, event) {
    const { type, targetPinId, params } = binding.action;
    const target = this.session.getPin(targetPinId);
    if (!target) return;

    try {
      this.registry.run(type, target, params, { session: this.session, source, target, event });
    } catch (error) {
      logger.error(`reaction "${binding.id}" (${type}) failed`, error);
    }
  }
}

/* ------------------ SESSION WIRING ------------------ */

/** session -> its ReactionStore, created on first ask. */
const STORES = new WeakMap();

/** session -> the ReactionRunner attached to it, if any. */
const RUNNERS = new WeakMap();

/**
 * The reaction store for a session, created on first access.
 *
 * The single place any layer - the runner, the editor, the serializer - reaches
 * a session's bindings, so all three read and write the one store.
 *
 * @returns {ReactionStore}
 */
export function reactionsFor(session) {
  let store = STORES.get(session);
  if (!store) {
    store = new ReactionStore();
    STORES.set(session, store);
  }
  return store;
}

/**
 * Attach a live reaction runner to a session, optionally seeding its bindings.
 *
 * Re-attaching detaches the previous runner first, so a re-wired session never
 * ends up with two runners racing the same signal. Seeded bindings are loaded
 * through the store's own validation, dropping any that name a Pin the session
 * does not (yet) hold.
 *
 * @param {CloudCanvasSession} session
 * @param {{bindings?: object[]}} [options]
 * @returns {{store: ReactionStore, runner: ReactionRunner, detach: () => void}}
 */
export function attachReactions(session, options = {}) {
  const store = reactionsFor(session);
  if (Array.isArray(options.bindings)) {
    store.load(options.bindings, { pinExists: (id) => Boolean(session.getPin(id)) });
  }

  const existing = RUNNERS.get(session);
  if (existing) existing.detach();

  const runner = new ReactionRunner(session, store).attach();
  RUNNERS.set(session, runner);
  return { store, runner, detach: () => detachReactions(session) };
}

/** Detach the session's reaction runner; its bindings are left in the store. */
export function detachReactions(session) {
  const runner = RUNNERS.get(session);
  if (runner) runner.detach();
  RUNNERS.delete(session);
}
