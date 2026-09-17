/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Graph traits: Pin-to-Pin connections, event transmission/relaying, and nested scope containers.
 */

import {
  connectorPathData,
  safeColor,
  safeNumber
} from '../../graphics/primitives/primitives.js';
import { h } from '../../graphics/primitives/element.js';
import { reconcileKeyedList } from './template-kit.js';
import { PinEvent, PinTrait } from './base.js';

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
    const pinMap = context?.pinMap || (pin._manager ? pin._manager.pins : null);
    if (this.forwardToConnections && pin.traits.has('connectable') && pinMap) {
      this._relayToConnections(pin, event, { ...context, pinMap });
    }
  }

  /**
   * Forward an event one hop along this pin's connections.
   *
   * Each hop carries a `detail.relayChain` of the pin ids already visited; a pin in
   * that chain is never forwarded to again, so mutual connections terminate instead
   * of recursing forever. Relayed events never bubble - the relay is the propagation.
   */
  _relayToConnections(pin, event, context) {
    const connTrait = pin.traits.get('connectable');
    const relayChain = [...(event?.detail?.relayChain || []), pin.id];

    for (const targetId of connTrait.getConnections()) {
      if (relayChain.includes(targetId)) continue;

      const targetPin = context.pinMap.get(targetId);
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
 * ConnectableTrait: Manages SVG connections to target Pins and renders in global SVG pass
 */
export class ConnectableTrait extends PinTrait {
  constructor(options = {}) {
    super(options, {
      name: 'connectable',
      capabilities: ['connectable', 'graph-node', 'global-render']
    });
    this.connections = new Set(options.connections || options.targets || options.connectTo || []);
    this.stroke = options.stroke || 'var(--cc-connector, rgba(56, 189, 248, 0.6))';
    this.strokeWidth = options.strokeWidth || 2;
    this.dashed = options.dashed !== undefined ? options.dashed : true;

    /**
     * Bumped on every change to `connections`.
     *
     * The SVG group layer gates its redraws on things it can see from outside a
     * trait - the camera, Pin geometry, the carrier count - and a connection
     * added to a Pin that was already carrying this trait moves none of them.
     * The counter is that missing input: the layer sums it across the
     * participating Pins, so a mutation in here is visible as a changed
     * signature without the layer knowing what a connection is.
     */
    this.revision = 0;

    /**
     * Scratch list handed to the SVG group layer's dependency gate, refilled in
     * place on every call. The gate runs on frames where nothing else changed,
     * so allocating a fresh array here would put garbage on every idle frame.
     * @type {Pin[]}
     */
    this._dependencies = [];
  }

  connectTo(targetPinId) {
    const before = this.connections.size;
    this.connections.add(targetPinId);
    if (this.connections.size !== before) this.revision += 1;
  }

  disconnectFrom(targetPinId) {
    if (this.connections.delete(targetPinId)) this.revision += 1;
  }

  getConnections() {
    return Array.from(this.connections);
  }

  isConnectedTo(targetPinId) {
    return this.connections.has(targetPinId);
  }


  /**
   * The Pins at the far end of this Pin's connections.
   *
   * A connector is drawn between two boxes, but only one of them carries the
   * trait, so the SVG group layer's carrier scan cannot see the other move. A
   * target that is re-measured - a scope well growing around it after the first
   * paint, say - changes this connector's geometry and nothing else's, and this
   * is how the layer is told (see `SvgGroupLayer` dependency gate).
   *
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

  /**
   * The connector group's persistent container.
   *
   * There is no fixed structure to build - the paths come and go with the
   * connections - so the build pass only hands the host `<g>` forward. Every
   * actual `<path>` is created, moved and removed by the keyed reconcile in
   * {@link onGlobalUpdate}, which is where the build/update discipline lives for
   * a variable-length child list.
   */
  onGlobalBuild(host, pinsWithThisTrait, globalContext) {
    return { host };
  }

  /**
   * Reconcile one `<path>` per connection whose *both* endpoints take part in the
   * current render root.
   *
   * This replaces the old re-stringify: instead of rebuilding the group's markup
   * every dirty frame, the desired connectors are collected as keyed items and
   * `reconcileKeyedList` reuses the `<path>` already holding each source->target
   * key, creating one only for a genuinely new connection and removing the paths
   * whose connection is gone. A path that stayed has only its `d` and stroke
   * attributes re-set, and only when they moved.
   *
   * The layer has already filtered the source Pins it hands over; the targets are
   * resolved here, from the pin map, so the same participation test is applied
   * again - otherwise a promoted subtree would trail connectors out to Pins that
   * are no longer in the document.
   */
  onGlobalUpdate(bindings, pinsWithThisTrait, globalContext) {
    const host = bindings.host;
    const pinMap = globalContext.pinMap;
    if (!host) return;

    const participates = typeof globalContext.participates === 'function'
      ? globalContext.participates
      : null;

    reconcileKeyedList(host, pinMap ? this._connectorItems(pinsWithThisTrait, pinMap, participates) : [], {
      key: (item) => item.key,
      create: () => h('path', { fill: 'none', 'vector-effect': 'non-scaling-stroke' }),
      update: (node, item) => this._writeConnector(node, item)
    });
  }

  /**
   * The connectors to draw this frame, one item per participating source->target
   * pair, each carrying the geometry and the drawing Pin's own stroke options.
   *
   * A fresh array per dirty frame is deliberate: this runs only when the layer's
   * gate has already decided the group changed, never on an idle frame, so it is
   * off the allocation-free path the idle gate protects (unlike
   * `collectRenderDependencies`, which does run idle and refills in place).
   */
  _connectorItems(pinsWithThisTrait, pinMap, participates) {
    const items = [];

    for (const sourcePin of pinsWithThisTrait) {
      const connTrait = sourcePin.traits.get(this.name);
      if (!connTrait || connTrait.connections.size === 0) continue;

      const p1 = sourcePin.getGlobalBounds();

      for (const targetId of connTrait.connections) {
        const targetPin = pinMap.get(targetId);
        if (!targetPin) continue;
        if (participates && !participates(targetPin)) continue;

        const p2 = targetPin.getGlobalBounds();
        items.push({
          key: `${sourcePin.id}->${targetId}`,
          d: connectorPathData(p1, p2),
          stroke: safeColor(connTrait.stroke, 'var(--cc-connector, rgba(56, 189, 248, 0.6))'),
          strokeWidth: safeNumber(connTrait.strokeWidth || 2, 2),
          dashed: connTrait.dashed
        });
      }
    }
    return items;
  }

  /**
   * Write one connector item into its `<path>`, each attribute only when it moved.
   *
   * The per-node cache is stamped on the element itself (`_ccConnector`), so it
   * survives the reconciler reusing, moving or reattaching the node and needs no
   * parallel map. `stroke-dasharray` is `none` for a solid connector - the same
   * value the string generator emitted - so the dashed/solid switch is a real
   * attribute change rather than a removed attribute.
   */
  _writeConnector(node, item) {
    const cache = node._ccConnector || (node._ccConnector = {});
    const dash = item.dashed ? '6,4' : 'none';

    if (cache.d !== item.d) { cache.d = item.d; node.setAttribute('d', item.d); }
    if (cache.stroke !== item.stroke) { cache.stroke = item.stroke; node.setAttribute('stroke', item.stroke); }
    if (cache.strokeWidth !== item.strokeWidth) {
      cache.strokeWidth = item.strokeWidth;
      node.setAttribute('stroke-width', String(item.strokeWidth));
    }
    if (cache.dash !== dash) { cache.dash = dash; node.setAttribute('stroke-dasharray', dash); }
  }
}
