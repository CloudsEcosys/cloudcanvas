/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The bridge: a class trait (`../pins/traits/base.js`) as a function trait the
 * core runs, `(b, opts, root) => cleanup`. Each hook lands where the core has a
 * place for it:
 *
 *   onAttach / onDetach          the run and its cleanup
 *   onTick(pin, dt, ctx)         a read tick
 *   onRender(pin, _, el, ctx)    a write tick
 *   onGlobalBuild / Update       a `<g data-trait>` in the root's SVG layer,
 *                                built once and updated in the write phase
 *   onTransmit                   the transmit hooks (`../pins/pin-scope.js`),
 *                                through `carrierOf(b).transmit()`
 *
 * The trait sees a carrier (`./carrier.js`), not the blit: the Pin surface it
 * was written against, answered from the blit's state. The pointer hooks are
 * the session router's and are not routed here.
 *
 *   blit.use({ drag: adaptTrait(DraggableTrait) });
 *   app.blit({ drag: true });
 */
import { schedule } from '../core/frame.js';
import { PinTrait } from '../pins/traits/base.js';
import { mergeOptions } from '../pins/traits/registry.js';
import { carrierOf, indexOf, releaseCarrier, svgLayerOf } from './carrier.js';

/** Whether the trait defines `hook` itself rather than inheriting the base no-op. */
function overrides(trait, hook) {
  return typeof trait[hook] === 'function' && trait[hook] !== PinTrait.prototype[hook];
}

/**
 * Turn a class trait into a function trait.
 * @param {new (options: object) => PinTrait} Ctor
 * @param {object} [defaults] options every instance starts from; the spec's options merge over them
 * @returns {(b: import('../core/blit.js').Blit, opts: any, root: object) => () => void}
 */
export function adaptTrait(Ctor, defaults = {}) {
  if (typeof Ctor !== 'function') throw new TypeError('adaptTrait: expected a trait class');

  return function adapted(b, opts, root) {
    const options = mergeOptions(defaults, opts && typeof opts === 'object' ? opts : {});
    const trait = new Ctor(options);
    const carrier = carrierOf(b);
    if (carrier.traits.has(trait.name)) {
      throw new Error(`adaptTrait: "${trait.name}" is already on ${carrier.id}`);
    }

    carrier.traits.set(trait.name, trait);
    trait.onAttach(carrier);
    const offs = [tickHooks(b, carrier, trait), globalHooks(root, carrier, trait)].flat();

    return () => {
      for (const off of offs) off();
      trait.onDetach(carrier);
      carrier.traits.delete(trait.name);
      if (carrier.traits.size === 0) releaseCarrier(carrier);
    };
  };
}

/* ------------------ PER-BLIT HOOKS ------------------ */

/** `onTick` in the read phase, `onRender` in the write phase. @returns {Function[]} offs */
function tickHooks(b, carrier, trait) {
  const offs = [];
  if (overrides(trait, 'onTick')) {
    offs.push(b.tick((ctx) => trait.onTick(carrier, ctx.dt, ctx), 'read'));
  }
  if (overrides(trait, 'onRender')) {
    offs.push(b.tick((ctx) => trait.onRender(carrier, null, b.el, ctx), 'write'));
  }
  return offs;
}

/* ------------------ GLOBAL RENDER ------------------ */

/**
 * Join the group for the trait's name: one `<g data-trait>` per name per root,
 * drawn by one write pass that outlives any single carrier. The first trait to
 * arrive builds the group's bindings; every carrier's trait state is read
 * through `pins[i].traits` on each update, as the legacy layer reads it.
 * @returns {Function[]} offs
 */
function globalHooks(root, carrier, trait) {
  if (!overrides(trait, 'onGlobalBuild') && !overrides(trait, 'onGlobalUpdate')) return [];

  const index = indexOf(root);
  let group = index.groups.get(trait.name);
  if (!group) {
    group = createGroup(root, trait);
    index.groups.set(trait.name, group);
  }
  group.carriers.add(carrier);
  schedule(root);

  return [() => leaveGroup(root, group, carrier)];
}

function createGroup(root, trait) {
  const host = document.createElementNS(svgLayerOf(root).namespaceURI, 'g');
  host.setAttribute('data-trait', trait.name);
  svgLayerOf(root).appendChild(host);

  const group = { name: trait.name, trait, host, bindings: null, carriers: new Set(), pass: null };
  group.pass = (ctx) => renderGroup(root, group, ctx);
  root.hooks.write.add(group.pass);
  return group;
}

/** The write pass: build once, then update with every carrier still in the document. */
function renderGroup(root, group, ctx) {
  const carriers = Array.from(group.carriers).filter((carrier) => carrier.element.isConnected);
  const context = { ...ctx, pinMap: indexOf(root).pinMap, participates: (pin) => pin.element.isConnected };

  if (!group.bindings) {
    group.bindings = group.trait.onGlobalBuild(group.host, carriers, context) || { host: group.host };
  }
  group.trait.onGlobalUpdate(group.bindings, carriers, context);
}

/** A carrier leaves; an empty group takes its pass and its `<g>` with it. */
function leaveGroup(root, group, carrier) {
  group.carriers.delete(carrier);
  if (group.carriers.size > 0) {
    schedule(root);
    return;
  }
  root.hooks.write.delete(group.pass);
  group.host.remove();
  indexOf(root).groups.delete(group.name);
}
