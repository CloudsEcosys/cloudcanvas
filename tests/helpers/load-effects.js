/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What importing a module does, observed rather than declared: imports each
 * module named on the command line, in order, and prints (as JSON) every
 * observable effect each import had - globals or built-in prototypes added,
 * changed or removed, the document changed, and calls that register work
 * (listeners, timers, frames, custom elements, fetches, console output).
 *
 *   node --import ./tests/helpers/setup.js tests/helpers/load-effects.js core/blit.js ...
 *
 * Run in its own process so nothing imported before it hides an effect. A
 * module's effect is reported on the first import that loads it.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Globals whose own keys and prototype keys a module could patch. */
const PATCHABLE = Object.freeze([
  'Object', 'Array', 'Function', 'String', 'Number', 'Boolean', 'Symbol', 'Promise', 'Map', 'Set', 'WeakMap',
  'WeakSet', 'Date', 'RegExp', 'Error', 'JSON', 'Math', 'Reflect', 'EventTarget', 'Node', 'Element',
  'HTMLElement', 'Document', 'CustomEvent', 'Event'
]);

/** Calls that register work or speak, as [owner path, method]. */
const REGISTERING = Object.freeze([
  ['EventTarget.prototype', 'addEventListener'], ['globalThis', 'addEventListener'],
  ['globalThis', 'setTimeout'], ['globalThis', 'setInterval'], ['globalThis', 'queueMicrotask'],
  ['globalThis', 'requestAnimationFrame'], ['globalThis', 'fetch'], ['customElements', 'define'],
  ['console', 'log'], ['console', 'info'], ['console', 'warn'], ['console', 'error'], ['console', 'debug']
]);

const calls = [];

function ownerOf(dotted) {
  return dotted.split('.').reduce((owner, key) => (key === 'globalThis' ? owner : owner?.[key]), globalThis);
}

/** Record every call to the registering functions; installed before the first snapshot. */
function recordCalls() {
  for (const [owner, method] of REGISTERING) {
    const target = ownerOf(owner);
    const original = target?.[method];
    if (typeof original !== 'function') continue;
    target[method] = function recorded(...args) {
      calls.push(`${owner}.${method}()`);
      return original.apply(this, args);
    };
  }
}

/** Every own key of `target`, with the identity of what it holds. */
function keysOf(label, target, into) {
  if (target === null || (typeof target !== 'object' && typeof target !== 'function')) return;
  for (const key of Reflect.ownKeys(target)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    into.set(`${label}.${String(key)}`, descriptor.get ?? descriptor.set ?? descriptor.value);
  }
}

/** The observable state an import could change. */
function snapshot() {
  const keys = new Map();
  keysOf('globalThis', globalThis, keys);
  for (const name of PATCHABLE) {
    keysOf(name, globalThis[name], keys);
    keysOf(`${name}.prototype`, globalThis[name]?.prototype, keys);
  }
  return { keys, dom: globalThis.document?.documentElement.outerHTML ?? '', calls: calls.length };
}

/** What changed between two snapshots, one line per effect. */
function difference(before, after) {
  const effects = [];
  for (const [key, value] of after.keys) {
    if (!before.keys.has(key)) effects.push(`added ${key}`);
    else if (!Object.is(before.keys.get(key), value)) effects.push(`changed ${key}`);
  }
  for (const key of before.keys.keys()) if (!after.keys.has(key)) effects.push(`removed ${key}`);
  if (before.dom !== after.dom) effects.push('changed the document');
  return [...effects, ...calls.slice(before.calls, after.calls).map((call) => `called ${call}`)];
}

recordCalls();
const report = {};
for (const file of process.argv.slice(2)) {
  const before = snapshot();
  await import(pathToFileURL(path.resolve(file)).href);
  report[file] = difference(before, snapshot());
}
process.stdout.write(JSON.stringify(report));
