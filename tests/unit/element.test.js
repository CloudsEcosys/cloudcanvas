/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The `h()` element factory: namespace routing, attribute handling, and child
 * flattening. These are the guarantees a `build`/`onGlobalBuild` pass relies on -
 * an SVG tag has to land in the SVG namespace or it renders nothing, and a
 * nullish child has to drop out or `cond && h(...)` breaks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { h, SVG_NS, SVG_TAGS } from '../../graphics/primitives/element.js';
import { resetDocument } from '../helpers/dom.js';

test('h - HTML tags are created in the HTML namespace', (t) => {
  t.after(resetDocument);

  const div = h('div');
  assert.equal(div.tagName.toLowerCase(), 'div');
  assert.notEqual(div.namespaceURI, SVG_NS, 'a div was created in the SVG namespace');
});

test('h - SVG tags are created in the SVG namespace', (t) => {
  t.after(resetDocument);

  for (const tag of ['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline']) {
    assert.ok(SVG_TAGS.has(tag), `${tag} is not in the SVG tag set`);
    const element = h(tag);
    assert.equal(element.namespaceURI, SVG_NS, `<${tag}> was not created in the SVG namespace`);
  }
});

test('h - class and className both write the class attribute', (t) => {
  t.after(resetDocument);

  assert.equal(h('div', { class: 'a b' }).getAttribute('class'), 'a b');
  // `className` is honoured too, and via setAttribute so it works on SVG, where
  // the className property is a read-only SVGAnimatedString.
  const path = h('path', { className: 'cc-link' });
  assert.equal(path.getAttribute('class'), 'cc-link');
});

test('h - style accepts a string whole or an object property by property', (t) => {
  t.after(resetDocument);

  assert.equal(h('div', { style: 'color: red' }).getAttribute('style'), 'color: red');

  const styled = h('div', { style: { color: 'red', '--cc-x': '3px' } });
  assert.equal(styled.style.getPropertyValue('color'), 'red');
  assert.equal(styled.style.getPropertyValue('--cc-x'), '3px');
});

test('h - data attributes and plain attributes are set as strings', (t) => {
  t.after(resetDocument);

  const el = h('div', { 'data-trait': 'connectable', 'stroke-width': 2 });
  assert.equal(el.getAttribute('data-trait'), 'connectable');
  assert.equal(el.getAttribute('stroke-width'), '2', 'a numeric attr was not stringified');
});

test('h - a boolean toggles the presence of an attribute', (t) => {
  t.after(resetDocument);

  assert.equal(h('button', { disabled: true }).hasAttribute('disabled'), true);
  assert.equal(h('button', { disabled: false }).hasAttribute('disabled'), false);
});

test('h - a null or undefined attribute is skipped', (t) => {
  t.after(resetDocument);

  const el = h('div', { title: null, id: undefined, 'data-keep': 'yes' });
  assert.equal(el.hasAttribute('title'), false);
  assert.equal(el.hasAttribute('id'), false);
  assert.equal(el.getAttribute('data-keep'), 'yes');
});

test('h - an on* function attribute binds a listener', (t) => {
  t.after(resetDocument);

  let clicks = 0;
  const button = h('button', { onClick: () => { clicks += 1; } });
  button.dispatchEvent(new Event('click'));
  button.dispatchEvent(new Event('click'));
  assert.equal(clicks, 2, 'the click listener was not bound as `click`');
});

test('h - string and number children become escaped text nodes', (t) => {
  t.after(resetDocument);

  const el = h('div', null, 'hello ', 42);
  assert.equal(el.childNodes.length, 2);
  assert.equal(el.textContent, 'hello 42');

  // Text, not markup: a child that looks like a tag stays inert.
  const inert = h('div', null, '<img onerror=alert(1)>');
  assert.equal(inert.children.length, 0, 'a string child was parsed as markup');
  assert.equal(inert.textContent, '<img onerror=alert(1)>');
});

test('h - Node children are appended and arrays are flattened', (t) => {
  t.after(resetDocument);

  const child = h('span', null, 'x');
  const parent = h('div', null, child, [h('b'), h('i')]);
  assert.equal(parent.children.length, 3);
  assert.equal(parent.firstElementChild, child);
  assert.equal(parent.children[1].tagName.toLowerCase(), 'b');
  assert.equal(parent.children[2].tagName.toLowerCase(), 'i');
});

test('h - nullish and boolean children are skipped', (t) => {
  t.after(resetDocument);

  const show = false;
  const el = h('div', null, null, undefined, false, true, show && h('span'), 'kept');
  assert.equal(el.children.length, 0, 'a skipped child leaked an element');
  assert.equal(el.textContent, 'kept');
});

test('h - nested arrays of children flatten completely', (t) => {
  t.after(resetDocument);

  const el = h('ul', null, [[h('li'), h('li')], [h('li')]]);
  assert.equal(el.querySelectorAll('li').length, 3);
});

test('h - builds a real SVG subtree with attributes and children', (t) => {
  t.after(resetDocument);

  const group = h('g', { 'data-trait': 'connectable' },
    h('path', { d: 'M 0 0 L 10 10', stroke: 'red', fill: 'none' })
  );

  assert.equal(group.namespaceURI, SVG_NS);
  const path = group.firstElementChild;
  assert.equal(path.namespaceURI, SVG_NS);
  assert.equal(path.getAttribute('d'), 'M 0 0 L 10 10');
  assert.equal(path.getAttribute('stroke'), 'red');
});
