/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The README's quick start, run as written: the fenced block between the
 * `quickstart` markers, its `cloudcanvas` specifiers resolved through the
 * package's own `exports`, imported into the test DOM over a `#app` host.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resetDocument, setElementSize } from '../helpers/dom.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MANIFEST = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/** The quick start's code, from the README itself. */
function quickStart() {
  const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const block = /<!-- quickstart -->\s*```js\n([\s\S]*?)```\s*<!-- \/quickstart -->/.exec(readme);
  assert.ok(block, 'the README has no quick start between the markers');
  return block[1];
}

/** `'cloudcanvas'` and `'cloudcanvas/<sub>'` as file URLs, through `exports`. */
function resolved(source) {
  return source.replace(/from '(cloudcanvas(?:\/[\w-]+)?)'/g, (_, specifier) => {
    const key = specifier === 'cloudcanvas' ? '.' : `./${specifier.slice('cloudcanvas/'.length)}`;
    const target = MANIFEST.exports[key];
    assert.ok(target, `the README imports ${specifier}, which the package does not export`);
    return `from '${pathToFileURL(path.join(ROOT, target)).href}'`;
  });
}

test('README - the quick start runs as written, and does what it says', async (t) => {
  t.after(resetDocument);
  const host = document.createElement('div');
  host.id = 'app';
  document.body.appendChild(host);
  setElementSize(host, 800, 600);
  const logged = [];
  t.mock.method(console, 'log', (...args) => logged.push(args));

  const file = path.join(mkdtempSync(path.join(tmpdir(), 'cc-readme-')), 'quickstart.mjs');
  writeFileSync(file, `${resolved(quickStart())}\nexport { app, note };\n`);
  const { app, note } = await import(pathToFileURL(file).href);

  assert.equal(note.parent, app);
  assert.equal(note.el.querySelector('[data-slot="title"]').textContent, 'Hello');
  assert.equal(note.el.querySelector('[data-slot="body"]').textContent, 'Placed by the core.');
  assert.deepEqual([note.x, note.y], [60, 40]);
  note.emit('note:open', { id: 'n1' });
  assert.equal(logged.length, 1);
  assert.equal(logged[0][0], 'opened');
  assert.deepEqual(logged[0][1], { id: 'n1' });
});
