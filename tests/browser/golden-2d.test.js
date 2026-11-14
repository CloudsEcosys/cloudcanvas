/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * 2D scenes unchanged (E6): every blit of the golden pages lands where it did in 0.5.0, relative to its root,
 * to half a pixel - the 3D camera, the GPU add-ons and the site's 3D view change nothing while the camera is flat.
 * The golden is `tests/fixtures/golden-2d.json`, captured from 0.5.0 by `tests/browser/golden-2d.js`.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PLAYWRIGHT_MISSING, loadChromium, startStaticServer } from './harness.js';
import { GOLDEN_FILE, GOLDEN_PAGES, capture } from './golden-2d.js';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser 2D golden suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, golden: JSON.parse(fs.readFileSync(GOLDEN_FILE, 'utf8')) };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  for (const page of GOLDEN_PAGES) {
    test(`2D golden - ${page} lays out as in 0.5.0`, async () => {
      const now = await capture(ctx.browser, ctx.server.url, page);
      const was = ctx.golden[page];
      assert.equal(now.length, was.length, 'the same roots');
      now.forEach((boxes, root) => {
        assert.equal(boxes.length, was[root].length, `root ${root}: the same blits`);
        boxes.forEach((box, i) => {
          const off = box.some((n, k) => Math.abs(n - was[root][i][k]) > 0.5);
          assert.ok(!off, `root ${root}, blit ${i}: [${box}] was [${was[root][i]}]`);
        });
      });
    });
  }
}
