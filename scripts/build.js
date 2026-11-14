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
import * as esbuild from 'esbuild';
import { ROOT, publicEntries, readManifest } from './entries.js';

const OUT_DIR = path.join(ROOT, 'dist');
const ENTRY = path.join(ROOT, 'index.js');

/** The split output's directory, relative to the root. */
const ESM_DIR = 'dist/esm';

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
  { outfile: 'dist/cloudcanvas.esm.js', format: 'esm', minify: false },
  { outfile: 'dist/cloudcanvas.esm.min.js', format: 'esm', minify: true },
  {
    outfile: 'dist/cloudcanvas.iife.js',
    format: 'iife',
    globalName: 'CloudCanvas',
    minify: false
  },
  {
    outfile: 'dist/cloudcanvas.iife.min.js',
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
 * Bundle one artifact. With `write` off the bytes stay in memory, which is how
 * `--check` compares against the committed file without touching it.
 * @returns {Promise<{outfile: string, bytes: Uint8Array, modules: number}>}
 */
async function buildTarget(target, write) {
  const { outfile, entry, ...options } = target;
  const result = await esbuild.build({
    ...SHARED,
    ...options,
    entryPoints: [entry ? path.join(ROOT, entry) : ENTRY],
    write,
    outfile: path.join(ROOT, outfile)
  });

  reportMessages(outfile, result.warnings, 'warning');

  const output = Object.values(result.metafile.outputs)[0];
  const bytes = write ? fs.readFileSync(path.join(ROOT, outfile)) : result.outputFiles[0].contents;
  return { outfile, bytes, modules: Object.keys(output.inputs).length };
}

/**
 * Split the core and every public add-on into `dist/esm/`, minified, shared
 * code in content-hashed chunks. Always built in memory: the caller writes
 * the files, or compares them, so `--check` sees the same bytes a build would.
 * @returns {Promise<Array<{outfile: string, bytes: Uint8Array, modules: number}>>}
 */
async function buildSplit() {
  const entries = publicEntries(pkg);
  const entryPoints = Object.fromEntries(entries.map(({ name, file }) => [name, path.join(ROOT, file)]));
  const result = await esbuild.build({
    ...SHARED,
    entryPoints,
    format: 'esm',
    minify: true,
    splitting: true,
    outdir: path.join(ROOT, ESM_DIR),
    write: false
  });

  reportMessages(ESM_DIR, result.warnings, 'warning');

  const built = result.outputFiles.map(({ path: absolute, contents }) => {
    const outfile = path.relative(ROOT, absolute);
    const output = result.metafile.outputs[outfile];
    return { outfile, bytes: contents, modules: Object.keys(output.inputs).length };
  });
  return built.sort(byEntryThenChunk(entries.map(({ name }) => `${ESM_DIR}/${name}.js`)));
}

/** Report order: the entries as `exports` lists them, then the chunks by name. */
function byEntryThenChunk(entryFiles) {
  const rank = (outfile) => {
    const index = entryFiles.indexOf(outfile);
    return index === -1 ? entryFiles.length : index;
  };
  return (a, b) => rank(a.outfile) - rank(b.outfile) || a.outfile.localeCompare(b.outfile);
}

/** Put the split output on disk, directories included. */
function writeSplit(built) {
  for (const { outfile, bytes } of built) {
    const target = path.join(ROOT, outfile);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
}

/** Every file under `dir` (relative to the root), recursively; none when it is absent. */
function filesUnder(dir) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(ROOT, path.join(entry.parentPath, entry.name)));
}

/** Raw, gzip and (informational) module count for one artifact. */
function measure({ outfile, bytes, modules }) {
  return {
    outfile,
    raw: bytes.length,
    gzip: zlib.gzipSync(bytes, { level: 9 }).length,
    modules
  };
}

/**
 * The artifacts whose committed bytes differ from a fresh build, plus any file
 * in the split directory the build no longer makes (a chunk whose hash moved);
 * empty is a pass.
 */
function findStale(built) {
  const expected = new Set(built.map(({ outfile }) => outfile));
  const stale = filesUnder(ESM_DIR).filter((file) => !expected.has(file)).map((file) => `${file}: not built`);
  for (const { outfile, bytes } of built) {
    const committed = path.join(ROOT, outfile);
    if (!fs.existsSync(committed)) {
      stale.push(`${outfile}: missing`);
      continue;
    }
    if (!fs.readFileSync(committed).equals(Buffer.from(bytes))) stale.push(`${outfile}: differs`);
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
  console.error('Run `npm run build` and commit dist/.');
  process.exitCode = 1;
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function printReport(rows) {
  console.log(`\nCloudCanvas v${pkg.version} - esbuild ${esbuild.version}`);
  console.log(`${'artifact'.padEnd(30)}${'raw'.padStart(12)}${'gzip'.padStart(12)}   modules`);

  for (const row of rows) {
    const name = path.relative(OUT_DIR, path.join(ROOT, row.outfile)).padEnd(30);
    console.log(`${name}${kib(row.raw).padStart(12)}${kib(row.gzip).padStart(12)}   ${row.modules}`);
  }
}

async function main() {
  const flag = process.argv[2];
  if (flag !== undefined && flag !== '--check') throw new Error(`Unknown flag ${flag}; expected --check`);
  const write = flag !== '--check';

  if (write) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const built = [];
  for (const target of TARGETS) built.push(await buildTarget(target, write));
  const split = await buildSplit();
  if (write) writeSplit(split);
  built.push(...split);

  printReport(built.map(measure));
  if (!write) check(built);
}

main().catch((error) => {
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    console.error(esbuild.formatMessagesSync(error.errors, { kind: 'error', color: true }).join('\n'));
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
