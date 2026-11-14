/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The public ESM entries - the core and each helper subpath - read from the
 * root `package.json` `exports`, the single build and publish truth.
 * `build.js` splits them into `dist/esm/` and `size.js` measures one row each.
 *
 * An entry is every `exports` key but `.` (the same module as `./core`, built
 * as the single-file bundles) and `./package.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root: this file lives one directory below it. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** `exports` keys that are not a split entry. */
const NOT_ENTRIES = /* @__PURE__ */ Object.freeze(['.', './package.json']);

/** The root manifest, parsed. */
export function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
}

/**
 * Every subpath entry, in `exports` order.
 * @param {{name: string, exports: Record<string, string>}} manifest
 * @returns {Array<{name: string, specifier: string, file: string}>} `name` is
 *   the subpath without `./`; `file` is the target, relative to the root
 */
export function publicEntries(manifest = readManifest()) {
  return Object.entries(manifest.exports)
    .filter(([key]) => !NOT_ENTRIES.includes(key))
    .map(([key, target]) => ({
      name: key.slice(2),
      specifier: `${manifest.name}/${key.slice(2)}`,
      file: target
    }));
}
