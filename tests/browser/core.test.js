/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The core in a real browser: a root with nested blits gets real layout, the
 * placement the handles claim is where Chromium draws it, a declared size is
 * the measured size, the scope offset is the one the child is drawn at, the
 * camera moves the plane, and a settled root asks for no frame.
 *
 * Run with `npm run test:browser`; fails without Playwright unless CLOUDCANVAS_BROWSER_OPTIONAL=1 (then skipped whole).
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYWRIGHT_MISSING,
  frames,
  loadChromium,
  openFixturePage,
  startStaticServer
} from './harness.js';

const CORE_FIXTURE = '/tests/browser/fixtures/core.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser core suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  test('core - nested blits are laid out where their bounds say, at their declared size', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, CORE_FIXTURE);
    await frames(page, 200);

    const state = await page.evaluate(() => {
      const { card, kid, grandkid } = window.__core;
      const box = (b) => {
        const rect = b.el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      };
      return {
        card: { bounds: card.bounds, box: box(card), size: card.size, parent: card.parent === window.__core.app },
        kid: { bounds: kid.bounds, box: box(kid), size: kid.size, inScope: kid.el.parentElement.hasAttribute('data-scope') },
        grandkid: { bounds: grandkid.bounds, box: box(grandkid), inKid: grandkid.el.parentElement === kid.el },
        title: card.el.querySelector('[data-slot="title"]').textContent,
        label: kid.el.querySelector('[data-slot="label"]').textContent,
        blits: window.__core.app.blits.length
      };
    });

    assert.equal(state.card.parent, true);
    assert.equal(state.blits, 1);
    assert.equal(state.title, 'Card');
    assert.equal(state.label, 'kid');
    assert.deepEqual(state.card.size, { w: 240, h: 160 });
    assert.deepEqual(state.card.box, { x: 100, y: 100, w: 240, h: 160 });
    assert.deepEqual(state.card.bounds, { x: 100, y: 100, w: 240, h: 160 });

    // The kid sits in the card's scope well, whose offset the read phase measured.
    assert.equal(state.kid.inScope, true);
    assert.deepEqual(state.kid.size, { w: 60, h: 20 });
    assert.ok(state.kid.bounds.y > 110, `the scope offset was not measured: ${JSON.stringify(state.kid.bounds)}`);
    assert.deepEqual(state.kid.box, { x: state.kid.bounds.x, y: state.kid.bounds.y, w: 60, h: 20 });

    assert.equal(state.grandkid.inKid, true);
    assert.deepEqual(state.grandkid.box, { x: state.kid.box.x + 5, y: state.kid.box.y + 5, w: 10, h: 10 });
    assert.deepEqual(state.grandkid.bounds, { x: state.kid.bounds.x + 5, y: state.kid.bounds.y + 5, w: 10, h: 10 });

    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core - a move lands next frame, view() moves the plane, and a settled root idles', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, CORE_FIXTURE);
    await frames(page, 200);

    await page.evaluate(() => { window.__core.card.set({ x: 300, fill: { title: 'Moved' } }); });
    await frames(page, 100);
    const moved = await page.evaluate(() => {
      const rect = window.__core.card.el.getBoundingClientRect();
      return { x: rect.x, title: window.__core.card.el.querySelector('[data-slot="title"]').textContent };
    });
    assert.deepEqual(moved, { x: 300, title: 'Moved' });

    const viewed = await page.evaluate(() => {
      const { app, kid, stateOf } = window.__core;
      const resolved = app.view(kid);
      const root = stateOf(app.el).root;
      return { resolved, planeBefore: root.plane.style.transform };
    });
    assert.equal(viewed.resolved.scale, 2.5);
    await frames(page, 100);

    const settled = await page.evaluate(() => {
      const { app, kid, stateOf } = window.__core;
      const root = stateOf(app.el).root;
      const kidRect = kid.el.getBoundingClientRect();
      const host = app.el.getBoundingClientRect();
      return {
        plane: root.plane.style.transform,
        rafId: root.rafId,
        dirty: root.dirty.size,
        measure: root.measure.size,
        // The framed blit is centred in the host.
        kidCentre: { x: kidRect.x + kidRect.width / 2 - host.x, y: kidRect.y + kidRect.height / 2 - host.y },
        hostCentre: { x: host.width / 2, y: host.height / 2 }
      };
    });
    assert.match(settled.plane, /scale\(2\.5(000)?\)/);
    assert.ok(Math.abs(settled.kidCentre.x - settled.hostCentre.x) < 1);
    assert.ok(Math.abs(settled.kidCentre.y - settled.hostCentre.y) < 1);
    assert.equal(settled.rafId, null, 'a settled root still had a frame requested');
    assert.equal(settled.dirty, 0);
    assert.equal(settled.measure, 0);

    assert.deepEqual(errors, []);
    await page.close();
  });
}
