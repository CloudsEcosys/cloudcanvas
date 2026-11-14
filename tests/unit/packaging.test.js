/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The core package stays the core: its entries are the contract list, the
 * entry exports exactly `blit` and `type`, no module reaches outside the
 * package, an unused entry bundles to nothing, the core carries no GPU or
 * add-on code, and a minimal page stays under its size ceiling.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as esbuild from 'esbuild';
import { ROOT, publicEntries, readManifest } from '../../scripts/entries.js';

const manifest = readManifest();

/** The 0.7 contract: the core's entries, in order. */
const ENTRIES = Object.freeze([
  '.', './core', './kernel', './log', './theme', './tokens', './primitives', './element', './vectorizer',
  './style-gates', './testing', './package.json'
]);

/** Ceiling for `blit('#app').blit({...})` from `cloudcanvas/core`, gzip -9 bytes. */
const MINIMAL_GZIP_MAX = 8000;

/** Names that only GPU, backend or content add-ons define (E1). */
const ADDON_MARKERS = Object.freeze([
  'gpuContent', 'clipMatrix', 'requestAdapter', 'drawArraysInstanced', 'fromXml', 'drawElementImage', 'cutGrid',
  'pathGeometry', 'Scene'
]);

/** Directories that hold the package's modules. */
const SOURCE_DIRS = Object.freeze(['core', 'graphics']);
const ROOT_MODULES = Object.freeze(['index.js', 'kernel.js', 'testing.js', 'log.js']);

/** One minified in-memory ESM bundle of `source`, resolved from the package root. */
async function bundle(source, { minify = true } = {}) {
  const result = await esbuild.build({
    stdin: { contents: source, resolveDir: ROOT, loader: 'js' },
    bundle: true, format: 'esm', minify, write: false, platform: 'browser', target: ['es2022'], logLevel: 'silent'
  });
  return result.outputFiles[0].contents;
}

/** Every `.js` file under `dir`, recursively. */
function sourcesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourcesUnder(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

/** The specifiers a module imports or re-exports from. */
function specifiersOf(file) {
  const text = fs.readFileSync(file, 'utf8');
  const pattern = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(?\s*['"]([^'"]+)['"]/g;
  return [...text.matchAll(pattern)].map((match) => match[1] || match[2]);
}

const gzip = (bytes) => zlib.gzipSync(bytes, { level: 9 }).length;

test('exports - exactly the 0.7 core entries, each naming a real file', () => {
  assert.deepEqual(Object.keys(manifest.exports), ENTRIES);
  for (const target of Object.values(manifest.exports)) {
    assert.ok(fs.existsSync(path.join(ROOT, target)), `${target} does not exist`);
  }
});

test('exports - the entry and the core subpath both export exactly blit and type', async () => {
  for (const key of ['.', './core']) {
    const entry = await import(path.join(ROOT, manifest.exports[key]));
    assert.deepEqual(Object.keys(entry).sort(), ['blit', 'type'], key);
  }
});

test('boundary - every import stays inside the package: relative, and resolving to one of its files', () => {
  const files = [...SOURCE_DIRS.flatMap((dir) => sourcesUnder(path.join(ROOT, dir))),
    ...ROOT_MODULES.map((name) => path.join(ROOT, name))];
  const offenders = files.flatMap((file) => specifiersOf(file)
    .filter((spec) => !spec.startsWith('.') || !path.resolve(path.dirname(file), spec).startsWith(ROOT + path.sep)
      || !fs.existsSync(path.resolve(path.dirname(file), spec)))
    .map((spec) => `${path.relative(ROOT, file)} -> ${spec}`));
  assert.deepEqual(offenders, []);
});

test('tree-shaking - every entry imported but unused bundles to 0 bytes', async () => {
  for (const { specifier } of publicEntries(manifest)) {
    assert.equal((await bundle(`import '${specifier}';`)).length, 0, `import '${specifier}' kept code`);
    assert.equal((await bundle(`import * as unused from '${specifier}';`)).length, 0, `namespace ${specifier} kept code`);
  }
});

test('core - the entry bundles only the core and the logger', async () => {
  const result = await esbuild.build({
    absWorkingDir: ROOT, entryPoints: ['index.js'], bundle: true, write: false, format: 'esm', metafile: true,
    logLevel: 'silent', outdir: path.join(ROOT, 'dist-in-memory')
  });
  const outside = Object.keys(result.metafile.inputs)
    .filter((input) => !input.startsWith('core/') && !['log.js', 'index.js'].includes(input));
  assert.deepEqual(outside, []);
});

test('gpu - the core and its bundles carry no GPU, backend or content symbol (E1)', async () => {
  const sources = {
    'the core entry': new TextDecoder().decode(await bundle("export * from './core/index.js';", { minify: false })),
    'dist/cloudcanvas.esm.js': fs.readFileSync(path.join(ROOT, 'dist/cloudcanvas.esm.js'), 'utf8'),
    'dist/cloudcanvas.iife.js': fs.readFileSync(path.join(ROOT, 'dist/cloudcanvas.iife.js'), 'utf8')
  };
  assert.ok(sources['the core entry'].includes('function blit'), 'the bundle is the real core, not a stub');
  for (const [label, text] of Object.entries(sources)) {
    const found = ADDON_MARKERS.filter((marker) => new RegExp(`\\b${marker}\\b`).test(text));
    assert.deepEqual(found, [], `${label} carries ${found.join(', ')}`);
  }
});

test('size - the minimal core entry, a root and one blit, is at most 8 KB gzipped', async () => {
  const bytes = await bundle(`import { blit } from '${manifest.name}/core';\nblit('#app').blit({ x: 100, y: 100 });`);
  assert.ok(bytes.length > 0);
  assert.ok(gzip(bytes) <= MINIMAL_GZIP_MAX, `minimal entry is ${gzip(bytes)} B gzipped`);
});
