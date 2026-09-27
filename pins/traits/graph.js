/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Graph traits: Pin-to-Pin connections, event transmission/relaying, and nested scope containers.
 */

import { PinEvent, PinTrait } from './base.js';
import { classFromTrait } from '../../addons/class-from-trait.js';
import {
  addConnection,
  connectBehaviour,
  connectorItem,
  removeConnection,
  updateConnectors,
  writeConnector
} from '../../addons/connect.js';
import { pinOf } from '../pin-hierarchy.js';

/**
 * TransmitterTrait: Programmable event dispatcher, message broadcaster, and telemetry router
 */
export class TransmitterTrait extends PinTrait {
  constructor(options = {}) {
    // Name stays caller-overridable: a Pin may carry several distinct transmitters.
    super(options, {
      name: options.name || 'transmitter',
      capabilities: ['transmitter', 'event-emitter']
    });
    this.listeners = new Map();
    this.forwardToConnections = Boolean(options.forwardToConnections);
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(pin, typeOrEvent, payload) {
    const evt = typeOrEvent instanceof PinEvent
      ? typeOrEvent
      : new PinEvent(typeof typeOrEvent === 'string' ? typeOrEvent : 'message', { payload, target: pin });
    return pin.transmit(evt);
  }

  onTransmit(pin, event, context) {
    const type = event?.type || 'message';
    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const fn of handlers) {
        fn(event, pin, context);
      }
    }

    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      for (const fn of wildcardHandlers) {
        fn(event, pin, context);
      }
    }

    // Optionally propagate along ConnectableTrait links
    if (this.forwardToConnections && pin.traits.has('connectable')) {
      this._relayToConnections(pin, event, context || {});
    }
  }

  /**
   * Forward an event one hop along this pin's connections.
   *
   * Each hop carries a `detail.relayChain` of the pin ids already visited; a pin in
   * that chain is never forwarded to again, so mutual connections terminate instead
   * of recursing forever. Relayed events never bubble - the relay is the propagation.
   *
   * A target is resolved by id (`relayTarget`): the element carrying that
   * `data-pin-id` in the source's own tree, else the source's manager, else a
   * `context.pinMap` handed to `transmit`.
   */
  _relayToConnections(pin, event, context) {
    const connTrait = pin.traits.get('connectable');
    const relayChain = [...(event?.detail?.relayChain || []), pin.id];

    for (const targetId of connTrait.getConnections()) {
      if (relayChain.includes(targetId)) continue;

      const targetPin = relayTarget(pin, targetId, context);
      if (!targetPin || targetPin === pin) continue;

      targetPin.transmit(new PinEvent(event?.type, {
        payload: event?.payload,
        bubbles: false,
        source: pin,
        timestamp: event?.timestamp,
        detail: { relayChain, relayedBy: pin.id }
      }), context);
    }
  }
}

/**
 * The Pin `id` names: in `pin`'s tree, else in its manager (a parked or
 * offloaded Pin is out of the tree but still registered - until S5 gives the
 * root an id index that includes parked blits), else in `context.pinMap`.
 */
function relayTarget(pin, id, context) {
  const root = pin.element && typeof pin.element.getRootNode === 'function' ? pin.element.getRootNode() : null;
  const selector = `[data-pin-id="${String(id).replace(/["\\]/g, '\\$&')}"]`;
  const element = root
    ? (root.nodeType === 1 && root.matches(selector) ? root : root.querySelector(selector))
    : null;
  const found = element ? pinOf(element) : null;
  if (found) return found;
  const registered = pin._manager && pin._manager.pins instanceof Map ? pin._manager.pins.get(id) : null;
  if (registered) return registered;
  return context.pinMap instanceof Map ? context.pinMap.get(id) || null : null;
}

/**
 * ScopeTrait: Turns a Pin into a nested workspace container that hosts child Pins
 */
export class ScopeTrait extends PinTrait {
  constructor(options = {}) {
    super(options, {
      name: 'scope',
      capabilities: ['scope-container', 'hierarchical-parent']
    });
  }

  onAttach(pin) {
    pin.getOrCreateScopeElement();
  }

  onActivate(pin, context) {
    for (const child of pin.children) {
      if (!child.lazy) {
        child.activate(context);
      }
    }
  }

  onRender(pin, contents, element, context) {
    const scopeEl = pin.getOrCreateScopeElement();
    if (scopeEl) {
      scopeEl.setAttribute('data-scope-id', pin.id);
    }
  }
}

/**
 * ConnectableTrait: the connect add-on (`../../addons/connect.js`) on a Pin.
 * Connections, stroke options and the connector drawing live there; the Pin
 * shell draws through the SVG group layer's global render, targets resolved
 * by id through the frame's `pinMap`.
 */
export class ConnectableTrait extends classFromTrait(connectBehaviour, 'connectable') {
  connectTo(targetPinId) {
    addConnection(this, targetPinId);
  }

  disconnectFrom(targetPinId) {
    removeConnection(this, targetPinId);
  }

  getConnections() {
    return Array.from(this.connections);
  }

  isConnectedTo(targetPinId) {
    return this.connections.has(targetPinId);
  }

  /**
   * The Pins at the far end of this Pin's connections: a re-measured target
   * changes this connector and nothing the layer's carrier scan can see.
   * @returns {Pin[]|null} the owned scratch list, valid until the next call
   */
  collectRenderDependencies(pin, context) {
    const pinMap = context ? context.pinMap : null;
    if (!pinMap || this.connections.size === 0) return null;

    const dependencies = this._dependencies;
    dependencies.length = 0;
    for (const targetId of this.connections) {
      const target = pinMap.get(targetId);
      if (target && target !== pin) dependencies.push(target);
    }
    return dependencies;
  }

  /** No fixed structure: the paths come and go with the connections. */
  onGlobalBuild(host, pinsWithThisTrait, globalContext) {
    return { host };
  }

  /** Reconcile one keyed `<path>` per connection whose both ends take part in the render root. */
  onGlobalUpdate(bindings, pinsWithThisTrait, globalContext) {
    const host = bindings.host;
    const pinMap = globalContext.pinMap;
    if (!host) return;

    const participates = typeof globalContext.participates === 'function' ? globalContext.participates : null;
    updateConnectors(host, pinMap ? this._connectorItems(pinsWithThisTrait, pinMap, participates) : []);
  }

  /** The connectors to draw, one item per participating source->target pair, each in its source's stroke. */
  _connectorItems(pinsWithThisTrait, pinMap, participates) {
    const items = [];
    for (const sourcePin of pinsWithThisTrait) {
      const connTrait = sourcePin.traits.get(this.name);
      if (!connTrait || connTrait.connections.size === 0) continue;

      const p1 = sourcePin.getGlobalBounds();
      for (const targetId of connTrait.connections) {
        const targetPin = pinMap.get(targetId);
        if (!targetPin || (participates && !participates(targetPin))) continue;
        items.push(connectorItem(`${sourcePin.id}->${targetId}`, p1, targetPin.getGlobalBounds(), connTrait));
      }
    }
    return items;
  }

  _writeConnector(node, item) {
    writeConnector(node, item);
  }
}
