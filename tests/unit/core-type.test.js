/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Types: defined from JS or declared as `<template data-type>`; a potential
 * blit whose spec is the defaults; never silently replaced.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from '../../core/index.js';
import { resetDocument } from '../helpers/dom.js';
import { coreScene } from '../helpers/core-scene.js';

/** Unique names per test: the type registry is module-level, like a document's templates. */
let counter = 0;
function name() {
  counter += 1;
  return `t${counter}`;
}

function host(t) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  t.after(resetDocument);
  return blit(element);
}

test('type - from JS: a potential blit over a <template>, its spec the defaults', (t) => {
  const app = host(t);
  const card = type(name(), { html: '<b data-slot="label">default</b>', defaults: { w: 120, h: 40, tone: 'cool' } });

  assert.equal(card.el.tagName, 'TEMPLATE');
  assert.equal(card.el.getAttribute('data-blit'), '');
  assert.equal(card.el.getAttribute('data-type'), card.spec.type);
  assert.deepEqual(card.spec, { type: card.spec.type, tone: 'cool', x: 0, y: 0, w: 120, h: 40, fill: { label: 'default' } });
  assert.equal(card.el.style.transform, '', 'a template is never painted');
  assert.equal(card.parent, null);

  const instance = app.blit({ type: card.spec.type, x: 5, y: 6 });
  assert.equal(instance.el.tagName, 'DIV');
  assert.equal(instance.el.getAttribute('data-type'), card.spec.type);
  assert.equal(instance.el.getAttribute('data-tone'), 'cool');
  assert.equal(instance.el.querySelector('[data-slot="label"]').textContent, 'default');
  assert.deepEqual(instance.size, { w: 120, h: 40 });
  assert.equal(card.el.content.querySelector('[data-slot="label"]').textContent, 'default', 'the template content is cloned, not moved');

  // A default fill is overridable slot by slot; a default key is overridable too.
  const other = app.blit({ type: card.spec.type, tone: 'warm', fill: { label: 'mine' } });
  assert.equal(other.el.getAttribute('data-tone'), 'warm');
  assert.equal(other.el.querySelector('[data-slot="label"]').textContent, 'mine');
});

test('type - declared in the document as <template data-type>', (t) => {
  const app = host(t);
  const typeName = name();
  const template = document.createElement('template');
  template.setAttribute('data-type', typeName);
  template.setAttribute('data-w', '90');
  template.innerHTML = '<span data-slot="text"></span><div data-scope></div>';
  document.head.appendChild(template);
  t.after(() => template.remove());

  const found = type(typeName);
  assert.equal(found.el, template);
  assert.deepEqual(found.spec, { type: typeName, x: 0, y: 0, w: 90, fill: { text: '' } });

  const instance = app.blit({ type: typeName, fill: { text: 'declared' } });
  assert.equal(instance.el.querySelector('[data-slot="text"]').textContent, 'declared');
  assert.equal(instance.size.w, 90);
  const kid = instance.blit({ x: 1, y: 1 });
  assert.equal(kid.el.parentElement.hasAttribute('data-scope'), true);
});

test('type - a name is never silently replaced; the same markup is the same type', (t) => {
  host(t);
  const typeName = name();
  const first = type(typeName, { html: '<i></i>' });

  assert.equal(type(typeName, { html: '<i></i>' }), first);
  assert.equal(type(typeName), first);
  assert.throws(() => type(typeName, { html: '<u></u>' }), /already defined with different markup/);
  assert.throws(() => type(''), /name must be a non-empty string/);
  assert.equal(type('never-declared'), null);
});

test('type - an unknown type on blit() is an error, not an empty element', (t) => {
  const app = host(t);
  assert.throws(() => app.blit({ type: 'nope' }), /unknown type "nope"/);
  assert.deepEqual(app.blits, []);
});

test('type - markup naming a type gets its structure when empty, and its defaults under what it declares', (t) => {
  type('mark-note', { html: '<h3 data-slot="title">Untitled</h3>', defaults: { tone: 'warm' } });
  const { app } = coreScene(t, '<div data-blit id="m" data-type="mark-note" data-x="10"></div>'
    + '<div data-blit id="own" data-type="mark-note" data-tone="cool"><p>kept</p></div>');
  const m = app.find('m');
  assert.equal(m.el.querySelector('[data-slot="title"]').textContent, 'Untitled');
  assert.equal(m.spec.tone, 'warm');
  assert.equal(m.x, 10);
  const own = app.find('own');
  assert.equal(own.el.querySelector('p').textContent, 'kept', 'authored children were replaced');
  assert.equal(own.spec.tone, 'cool', 'a declared key was overwritten by the default');
});
