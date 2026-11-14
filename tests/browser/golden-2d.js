/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The 2D golden (E6): where every blit of a set of 2D pages lands, relative to its root, read from a real browser.
 * `tests/fixtures/golden-2d.json` was captured from the 0.5.0 release (before the 3D camera and the GPU) with
 * `node tests/browser/golden-2d.js <a checkout of 0.5.0>`; `golden-2d.test.js` holds today's pages to it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, frames, loadChromium, startStaticServer } from './harness.js';

/**
 * The pages: the site's first board (at 0.5.0 it was served as `/.site/website.html`).
 * The 0.5.0 engine fixtures' goldens live with those fixtures, in `cloudcanvas-lib`.
 */
export const GOLDEN_PAGES = Object.freeze([
  '/tests/browser/fixtures/core.html'
]);

export const GOLDEN_FILE = path.join(REPO_ROOT, 'tests/fixtures/golden-2d.json');

/** Every blit's box, `[x, y, w, h]` from its root's corner, per root, in document order. */
export async function capture(browser, url, page) {
  const tab = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await tab.goto(`${url}${page}`, { waitUntil: 'load' });
  await frames(tab, 400);
  const boxes = await tab.evaluate(() => Array.from(document.querySelectorAll('[data-blit-root]'), (root) => {
    const origin = root.getBoundingClientRect();
    return Array.from(root.querySelectorAll('[data-blit]'), (element) => {
      const box = element.getBoundingClientRect();
      return [box.left - origin.left, box.top - origin.top, box.width, box.height].map((n) => Math.round(n * 2) / 2);
    });
  }));
  await tab.close();
  return boxes;
}

async function main(checkout) {
  const chromium = await loadChromium();
  const server = await startStaticServer(checkout);
  const browser = await chromium.launch();
  const golden = {};
  for (const page of GOLDEN_PAGES) golden[page] = await capture(browser, server.url, page);
  await browser.close();
  await server.close();
  fs.writeFileSync(GOLDEN_FILE, `${JSON.stringify(golden)}\n`);
  console.log(`golden written from ${checkout}: ${Object.values(golden).flat(2).length} boxes`);
}

if (process.argv[1] && process.argv[1].endsWith('golden-2d.js')) {
  main(path.resolve(process.argv[2] || REPO_ROOT)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
