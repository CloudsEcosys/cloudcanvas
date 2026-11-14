/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The release bundler (`scripts/build.js`): its output does not depend on the
 * working directory, a failed write never leaves `dist/` half replaced, and
 * `--check` reports a stray file anywhere under `dist/`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from '../../scripts/entries.js';
import { findStale, writeDist } from '../../scripts/build.js';

const BUILD = path.join(ROOT, 'scripts/build.js');
const bytes = (text) => new TextEncoder().encode(text);

/** A temporary `dist/` holding `files` ({relative path: text}), removed after the test. */
function tempDist(t, files) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'cloudcanvas-build-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const outDir = path.join(parent, 'dist');
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true });
    fs.writeFileSync(path.join(outDir, file), text);
  }
  return outDir;
}

test('build - --check from another working directory passes: output is relative to the package root', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('build - --check reports a file the build does not make, anywhere under dist/', (t) => {
  const outDir = tempDist(t, { 'a.js': 'a', 'esm/b.js': 'b', 'stray.txt': 'x', 'old/c.js': 'c', 'esm/d.js': 'd' });
  const built = [{ file: 'a.js', bytes: bytes('a') }, { file: 'esm/b.js', bytes: bytes('changed') },
    { file: 'esm/e.js', bytes: bytes('e') }];
  assert.deepEqual(findStale(built, outDir).sort(), [
    'dist/esm/b.js: differs', 'dist/esm/d.js: not built', 'dist/esm/e.js: missing', 'dist/old/c.js: not built',
    'dist/stray.txt: not built'
  ]);
  assert.deepEqual(findStale([{ file: 'a.js', bytes: bytes('a') }], tempDist(t, { 'a.js': 'a' })), []);
});

test('build - a write replaces dist/ whole, and a failed one leaves it as it was', (t) => {
  const outDir = tempDist(t, { 'old.js': 'old' });
  writeDist([{ file: 'a.js', bytes: bytes('a') }, { file: 'esm/b.js', bytes: bytes('b') }], outDir);
  assert.deepEqual(fs.readdirSync(outDir, { recursive: true }).sort(), ['a.js', 'esm', 'esm/b.js']);

  const conflicting = [{ file: 'x', bytes: bytes('file') }, { file: 'x/y.js', bytes: bytes('under a file') }];
  assert.throws(() => writeDist(conflicting, outDir));
  assert.deepEqual(fs.readdirSync(outDir, { recursive: true }).sort(), ['a.js', 'esm', 'esm/b.js']);
  assert.deepEqual(fs.readdirSync(path.dirname(outDir)), ['dist'], 'no temporary directory is left behind');
});
