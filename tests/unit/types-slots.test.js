/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Core `type()` slots: `fill` is plain text unless the TEMPLATE marks the slot
 * `data-slot-html`; spec data can never turn markup on. Also the `template`
 * and `with` definition keys.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from '../../core/index.js';
import { setLogSink } from '../../log.js';
import { resetDocument } from '../helpers/dom.js';

let counter = 0;
function name() {
  counter += 1;
  return `slots${counter}`;
}

function host(t) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  t.after(resetDocument);
  return blit(element);
}

const IMG = '<img src="x" onerror="globalThis.__pwned = 1">';

test('slots - a text slot takes markup as text: no element, no handler', (t) => {
  const app = host(t);
  const typeName = name();
  type(typeName, { html: '<p data-slot="body"></p>' });

  const card = app.blit({ type: typeName, fill: { body: IMG } });
  const slot = card.el.querySelector('[data-slot="body"]');
  assert.equal(slot.children.length, 0, 'markup in a text slot became an element');
  assert.equal(slot.textContent, IMG);
  assert.equal(card.el.querySelector('img'), null);
  assert.equal(card.spec.fill.body, IMG, 'the spec reads the text back');
});

test('slots - markup lands only in a slot the template marks data-slot-html', (t) => {
  const app = host(t);
  const typeName = name();
  type(typeName, { html: '<h3 data-slot="title"></h3><div data-slot="body" data-slot-html></div>' });

  const card = app.blit({ type: typeName, fill: { title: '<b>t</b>', body: '<b>bold</b>' } });
  assert.equal(card.el.querySelector('[data-slot="title"]').textContent, '<b>t</b>');
  assert.equal(card.el.querySelector('[data-slot="body"] b').textContent, 'bold');
  assert.deepEqual(card.spec.fill, { title: '<b>t</b>', body: '<b>bold</b>' }, 'html reads back as markup');
  const copy = app.blit(card.spec);
  assert.equal(copy.el.querySelector('[data-slot="body"] b').textContent, 'bold', 'the spec round-trips');
});

test('slots - spec data cannot opt a slot into markup', (t) => {
  const app = host(t);
  const typeName = name();
  type(typeName, { html: '<p data-slot="title"></p><div data-slot="body" data-slot-html></div>' });
  const card = app.blit({ type: typeName });

  // A key named like the marker lands on the blit element, never on a slot.
  card.set({ slotHtml: '' });
  card.set({ fill: { title: IMG } });
  assert.equal(card.el.querySelector('[data-slot="title"]').children.length, 0);

  // A slot smuggled in through html fill is not addressable: the real text slot still wins.
  card.set({ fill: { body: '<i data-slot="title" data-slot-html></i>' } });
  card.set({ fill: { title: IMG } });
  assert.equal(card.el.querySelector('img'), null, 'a fill-made slot took markup');
  assert.equal(card.el.querySelector('p[data-slot="title"]').textContent, IMG);
  assert.equal(card.el.querySelector('i[data-slot="title"]').textContent, '');
  assert.equal(card.spec.fill.title, IMG);
});

test('slots - a javascript: URL in fill never becomes an attribute', (t) => {
  const app = host(t);
  const typeName = name();
  type(typeName, { html: '<a href="/safe" data-slot="link"></a>' });

  const card = app.blit({ type: typeName, fill: { link: 'javascript:alert(1)' } });
  const anchor = card.el.querySelector('a');
  assert.equal(anchor.getAttribute('href'), '/safe', 'fill wrote an attribute');
  assert.equal(anchor.textContent, 'javascript:alert(1)');
  assert.throws(() => card.set({ fill: { href: 'javascript:alert(1)' } }), /no slot "href"/);
});

test('slots - __proto__ keys neither pollute nor reach a slot as anything but text', (t) => {
  const app = host(t);
  const typeName = name();
  const defaults = JSON.parse('{"__proto__": {"polluted": 1}, "tone": "cool"}');
  type(typeName, { html: '<span data-slot="__proto__"></span>', defaults });

  const card = app.blit({ type: typeName, fill: JSON.parse(`{"__proto__": ${JSON.stringify(IMG)}}`) });
  assert.equal(({}).polluted, undefined, 'Object.prototype was polluted');
  assert.equal(card.el.querySelector('img'), null);
  assert.equal(card.el.querySelector('[data-slot="__proto__"]').textContent, IMG);
  assert.equal(Object.hasOwn(card.spec.fill, '__proto__'), true, 'the slot reads back as an own key');
  assert.equal(Object.getPrototypeOf(card.spec.fill), Object.prototype);
  assert.throws(() => card.set({ fill: JSON.parse('{"constructor": "x"}') }), /no slot "constructor"/);
});

test('type - {template} registers the element itself; other markup under the name throws', (t) => {
  const app = host(t);
  const typeName = name();
  const template = document.createElement('template');
  template.innerHTML = '<em data-slot="label"></em>';

  const handle = type(typeName, { template, defaults: { w: 30 } });
  assert.equal(handle.el, template);
  assert.equal(template.getAttribute('data-type'), typeName);
  assert.equal(type(typeName, { template }), handle, 'the same template is the same type');
  assert.equal(app.blit({ type: typeName, fill: { label: 'x' } }).el.querySelector('em').textContent, 'x');
  assert.throws(() => type(typeName, { html: '<u></u>' }), /already defined with different markup/);
  assert.throws(() => type(name(), { template: document.createElement('div') }), /template must be a <template>/);
});

test('type - with: every instance runs the type traits, stopped on remove', (t) => {
  const app = host(t);
  const typeName = name();
  const seen = [];
  const trait = (b, opts, root) => {
    seen.push({ b, opts, root: Boolean(root) });
    return () => seen.push('stopped');
  };
  type(typeName, { html: '<i></i>', with: [trait] });
  assert.throws(() => type(name(), { with: ['nope'] }), /with must be an array of functions/);

  const one = app.blit({ type: typeName });
  const two = app.blit({ type: typeName });
  assert.deepEqual(seen.map((entry) => entry.b), [one, two]);
  assert.equal(seen[0].opts, true);
  assert.equal(seen[0].root, true);

  const warnings = [];
  const previous = setLogSink((record) => warnings.push(record.message), { level: 'warn' });
  t.after(() => setLogSink(previous));
  assert.equal('with' in one.spec, false, 'a type trait is the type\'s, not the instance spec\'s');
  assert.deepEqual(warnings, [], 'reading an instance spec warned about its type traits');

  one.remove();
  assert.equal(seen.at(-1), 'stopped');
});
