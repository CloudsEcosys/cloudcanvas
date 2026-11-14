/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Release-time bundler: turns `index.js` (the core) into the two single-file
 * distribution artifacts, each with a minified sibling, and splits every
 * public subpath entry into `dist/esm/` - one file per entry, shared chunks.
 *
 *   node scripts/build.js            rebuild `dist/` and print the size report
 *   node scripts/build.js --check    rebuild in memory; exit 1 if `dist/` differs
 *                                    or holds any file the build does not make
 *
 * Every artifact is built in memory first; a build writes them to a staging
 * directory beside `dist/` and swaps it in whole, so a failed build or write
 * leaves the committed `dist/` as it was. Paths resolve from the root, never
 * the working directory, so the output is the same wherever it is run from.
 *
 * `dist/` is committed: a stale dist is a real defect and `--check` is the
 * gate that catches one. The unit suites import the source directly and never
 * see it. It exists for three consumers the source tree cannot serve:
 *
 *   - `cloudcanvas.esm.js`  one `<script type="module">` import over http(s),
 *                           no import map and no directory of module requests.
 *   - `cloudcanvas.iife.js` the strict zero-server case. A plain non-module
 *                           `<script src>` is the *only* form that loads from a
 *                           `file://` URL: Chromium fetches module scripts in
 *                           CORS mode, which a `file://` origin always fails,
 *                           and bundling to a single module does not change
 *                           that - the failure is the fetch mode, not the
 *                           number of requests.
 *   - `esm/<entry>.js`      the core, the add-on kernel and each helper
 *                           (`./entries.js`) as its own minified module, their
 *                           shared code in `esm/chunk-*.js`: pay-for-use over
 *                           http(s) with no bundler, one copy of the core
 *                           however many entries a page imports.
 *
 * The add-ons, the UI kit and their bundles are cloudcanvas-lib's.
 *
 * A Node script rather than a package.json one-liner: several related outputs
 * share one config, and the size report below is the only place raw/gzip
 * numbers are measured rather than guessed.
 *
 * Single dependency: esbuild, a devDependency.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { ROOT, publicEntries, readManifest } from './entries.js';

const OUT_DIR = path.join(ROOT, 'dist');
const ENTRY = 'index.js';

/** The split output's directory, relative to `dist/`. */
const ESM_DIR = 'esm';

const pkg = readManifest();

/**
 * Survives minification (`legalComments: 'inline'` would move it; a banner is
 * emitted verbatim ahead of everything either way).
 */
const BANNER = [
  '/*!',
  ` * CloudCanvas v${pkg.version} - ${pkg.description}`,
  ' * Written by Richard Christopher, Copyright 2026 NeoTec, LLC',
  ` * ${pkg.license} License. ${pkg.homepage}`,
  ' */'
].join('\n');

/**
 * Baseline shared by every artifact.
 *
 * `target` is the floor the framework already assumes - private class fields,
 * `structuredClone`-era DOM, top-level `??=` - so esbuild transpiles nothing it
 * does not have to and the ESM output stays close to the source it came from.
 */
const SHARED = {
  absWorkingDir: ROOT,
  bundle: true,
  platform: 'browser',
  target: ['es2022'],
  charset: 'utf8',
  banner: { js: BANNER },
  logLevel: 'silent',
  metafile: true
};

/** The four single-file artifacts, in report order. */
const TARGETS = [
  { file: 'cloudcanvas.esm.js', format: 'esm', minify: false },
  { file: 'cloudcanvas.esm.min.js', format: 'esm', minify: true },
  {
    file: 'cloudcanvas.iife.js',
    format: 'iife',
    globalName: 'CloudCanvas',
    minify: false
  },
  {
    file: 'cloudcanvas.iife.min.js',
    format: 'iife',
    globalName: 'CloudCanvas',
    minify: true
  }
];

/** esbuild messages are reported, never swallowed - a clean build says so. */
function reportMessages(label, messages, kind) {
  if (messages.length === 0) return;
  console.log(`\n${label}: ${messages.length} ${kind}(s)`);
  console.log(esbuild.formatMessagesSync(messages, { kind, color: false }).join('\n'));
}

/**
 * Bundle one single-file artifact, in memory.
 * @returns {Promise<{file: string, bytes: Uint8Array, modules: number}>} `file` relative to `dist/`
 */
async function buildTarget({ file, ...options }) {
  const result = await esbuild.build({
    ...SHARED,
    ...options,
    entryPoints: [ENTRY],
    write: false,
    outfile: path.join(OUT_DIR, file)
  });

  reportMessages(file, result.warnings, 'warning');

  const output = Object.values(result.metafile.outputs)[0];
  return { file, bytes: result.outputFiles[0].contents, modules: Object.keys(output.inputs).length };
}

/**
 * Split the core and every public entry into `dist/esm/`, minified, shared
 * code in content-hashed chunks, in memory like every other artifact.
 * @returns {Promise<Array<{file: string, bytes: Uint8Array, modules: number}>>}
 */
async function buildSplit() {
  const entries = publicEntries(pkg);
  const entryPoints = Object.fromEntries(entries.map(({ name, file }) => [name, file]));
  const result = await esbuild.build({
    ...SHARED,
    entryPoints,
    format: 'esm',
    minify: true,
    splitting: true,
    outdir: path.join(OUT_DIR, ESM_DIR),
    write: false
  });

  reportMessages(`dist/${ESM_DIR}`, result.warnings, 'warning');

  const built = result.outputFiles.map(({ path: absolute, contents }) => {
    const output = result.metafile.outputs[path.relative(ROOT, absolute)];
    return { file: path.relative(OUT_DIR, absolute), bytes: contents, modules: Object.keys(output.inputs).length };
  });
  return built.sort(byEntryThenChunk(entries.map(({ name }) => `${ESM_DIR}/${name}.js`)));
}

/** Report order: the entries as `exports` lists them, then the chunks by name. */
function byEntryThenChunk(entryFiles) {
  const rank = (file) => {
    const index = entryFiles.indexOf(file);
    return index === -1 ? entryFiles.length : index;
  };
  return (a, b) => rank(a.file) - rank(b.file) || a.file.localeCompare(b.file);
}

/** Every artifact, in report order. */
async function buildAll() {
  const built = [];
  for (const target of TARGETS) built.push(await buildTarget(target));
  built.push(...(await buildSplit()));
  return built;
}

/**
 * Replace `outDir` with exactly `built`: written to a staging directory beside
 * it, then swapped in. A failure anywhere leaves `outDir` as it was.
 * @param {Array<{file: string, bytes: Uint8Array}>} built `file` relative to `outDir`
 */
export function writeDist(built, outDir = OUT_DIR) {
  const staging = fs.mkdtempSync(path.join(path.dirname(outDir), '.dist-staging-'));
  try {
    for (const { file, bytes } of built) {
      const target = path.join(staging, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
    swapIn(staging, outDir);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

/** Move `staging` to `outDir`, retiring the old one; restore it if the move fails. */
function swapIn(staging, outDir) {
  const retired = `${staging}-retired`;
  if (fs.existsSync(outDir)) fs.renameSync(outDir, retired);
  try {
    fs.renameSync(staging, outDir);
  } catch (error) {
    if (fs.existsSync(retired)) fs.renameSync(retired, outDir);
    throw error;
  }
  fs.rmSync(retired, { recursive: true, force: true });
}

/** Every file under `dir`, relative to it, recursively; none when it is absent. */
function filesUnder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)));
}

/** Raw, gzip and (informational) module count for one artifact. */
function measure({ file, bytes, modules }) {
  return {
    file,
    raw: bytes.length,
    gzip: zlib.gzipSync(bytes, { level: 9 }).length,
    modules
  };
}

/**
 * The artifacts whose committed bytes differ from a fresh build or are
 * missing, plus every file anywhere under `outDir` the build does not make
 * (a chunk whose hash moved, a stray); empty is a pass.
 * @param {Array<{file: string, bytes: Uint8Array}>} built `file` relative to `outDir`
 * @returns {string[]}
 */
export function findStale(built, outDir = OUT_DIR) {
  const label = (file) => `${path.basename(outDir)}/${file}`;
  const expected = new Set(built.map(({ file }) => file));
  const stale = filesUnder(outDir).filter((file) => !expected.has(file)).map((file) => `${label(file)}: not built`);
  for (const { file, bytes } of built) {
    const committed = path.join(outDir, file);
    if (!fs.existsSync(committed)) stale.push(`${label(file)}: missing`);
    else if (!fs.readFileSync(committed).equals(Buffer.from(bytes))) stale.push(`${label(file)}: differs`);
  }
  return stale;
}

function check(built) {
  const stale = findStale(built);
  if (stale.length === 0) {
    console.log('\nDist check passed: dist/ matches the source.');
    return;
  }
  console.error(`\nDist check failed:\n  ${stale.join('\n  ')}`);
  console.error('Run `npm run build:dist` and commit dist/.');
  process.exitCode = 1;
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function printReport(rows) {
  console.log(`\nCloudCanvas v${pkg.version} - esbuild ${esbuild.version}`);
  console.log(`${'artifact'.padEnd(30)}${'raw'.padStart(12)}${'gzip'.padStart(12)}   modules`);

  for (const row of rows) {
    const name = row.file.padEnd(30);
    console.log(`${name}${kib(row.raw).padStart(12)}${kib(row.gzip).padStart(12)}   ${row.modules}`);
  }
}

async function main() {
  const flag = process.argv[2];
  if (flag !== undefined && flag !== '--check') throw new Error(`Unknown flag ${flag}; expected --check`);

  const built = await buildAll();
  printReport(built.map(measure));
  if (flag === '--check') check(built);
  else writeDist(built);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    if (Array.isArray(error.errors) && error.errors.length > 0) {
      console.error(esbuild.formatMessagesSync(error.errors, { kind: 'error', color: true }).join('\n'));
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });
}
