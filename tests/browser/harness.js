/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Browser harness for the core's pages: a throwaway static server over the
 * repository, the optional Playwright dependency, and the page wiring every
 * check shares. The add-on, UI kit and board pages (and their harness) are
 * cloudcanvas-lib's.
 *
 * `playwright` is a devDependency: when it is absent the suite reports a skip
 * instead of failing, so `npm test` (headless, happy-dom) and
 * `npm run test:browser` (real chromium) live in the same repository without
 * one gating the other.
 */
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, derived from this file's location. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const PLAYWRIGHT_MISSING = [
  '',
  'SKIPPED: the browser smoke suite needs Playwright and a chromium build.',
  '  npm install --save-dev playwright && npx playwright install chromium',
  'Then re-run: npm run test:browser',
  ''
].join('\n');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

/** Chromium launcher, or null when the optional dependency is not installed. */
export async function loadChromium() {
  try {
    const playwright = await import('playwright');
    return playwright.chromium;
  } catch {
    return null;
  }
}

/**
 * Resolve a request path inside `rootDir`, or null when it may not be served.
 *
 * The server only listens on loopback for a test run, but it still refuses
 * what a checkout should never hand out: anything outside the root (measured
 * after `path.resolve` collapses `..`), any hidden segment (`/.git/config`,
 * an encoded `%2egit` included, as the path is decoded first) and installed
 * code under `node_modules`.
 */
function resolveRequestPath(rootDir, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }
  const resolved = path.resolve(rootDir, `.${pathname}`);
  const relative = path.relative(rootDir, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  const segments = relative.split(path.sep);
  if (segments.some((segment) => segment.startsWith('.') || segment === 'node_modules')) return null;
  return resolved;
}

async function serveFile(rootDir, req, res) {
  if (req.url === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }

  const filePath = resolveRequestPath(rootDir, req.url);
  const stats = filePath ? await stat(filePath).catch(() => null) : null;

  if (!stats || !stats.isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(res);
}

/**
 * Serve `rootDir` on a free loopback port.
 * @returns {Promise<{url: string, close: () => Promise<void>}>}
 */
export async function startStaticServer(rootDir = REPO_ROOT) {
  const server = http.createServer((req, res) => {
    serveFile(rootDir, req, res).catch(() => {
      res.writeHead(500, { 'content-type': 'text/plain' }).end('Server error');
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

/**
 * Console errors and uncaught exceptions are failures, not noise.
 *
 * @param {(text: string) => boolean} [ignoreConsole] a console error the page is
 *   expected to log, e.g. a resource a suite 404s on purpose
 */
function collectErrors(page, errors, ignoreConsole = null) {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (message.text().includes('favicon')) return;
    if (ignoreConsole && ignoreConsole(message.text())) return;
    errors.push(`console: ${message.text()}`);
  });
}

/**
 * The one request failure that is the host's doing, not the page's.
 *
 * Chromium watches the machine's netlink feed, and on any address or link change
 * - a container's veth going down is enough - it fails every queued and
 * connecting request with this code, loopback included. A module graph caught
 * mid-load never executes, so the page sits un-booted with nothing else wrong.
 */
const NETWORK_CHANGED = 'net::ERR_NETWORK_CHANGED';

/** Boots one open or reload may spend on host network changes before it gives up. */
const NETWORK_CHANGE_ATTEMPTS = 3;

/**
 * A fresh page, booted by `plan.boot`, with its errors collected.
 *
 * A page whose load Chromium aborted with {@link NETWORK_CHANGED} is discarded
 * whole - its errors with it - and a new one is prepared and booted in its
 * place. Every other failure is thrown as it is, carrying the page's errors.
 *
 * @param {object} plan
 * @param {(page: object) => Promise<void>} plan.boot navigates, then waits for readiness
 * @param {object} [plan.pageOptions] `browser.newPage` options
 * @param {(page: object) => (object|Promise<object>)} [plan.prepare] runs on each
 *   fresh page before `boot` - routes, request taps; the properties of what it
 *   returns are handed back alongside `page` and `errors`
 * @param {(text: string) => boolean} [plan.ignoreConsole] see {@link collectErrors}
 * @returns {Promise<{page: object, errors: string[]}>}
 */
export async function openBootedPage(browser, { boot, pageOptions = {}, prepare = null, ignoreConsole = null }) {
  for (let attempt = 1; attempt <= NETWORK_CHANGE_ATTEMPTS; attempt += 1) {
    const page = await browser.newPage(pageOptions);
    const errors = [];
    collectErrors(page, errors, ignoreConsole);
    const prepared = prepare ? await prepare(page) : {};

    if (!(await bootVoidedByNetwork(page, errors, boot))) {
      await assertUniqueBlitIds(page);
      return { ...prepared, page, errors };
    }
    await page.close();
    reportVoidedBoot(attempt, 'page discarded');
  }
  throw networkGaveUp();
}

/**
 * Run `boot` once, watching for the host's network abort.
 * @returns {Promise<boolean>} true when a {@link NETWORK_CHANGED} failure voided it
 */
async function bootVoidedByNetwork(page, errors, boot) {
  let networkChanged = false;
  const watch = (request) => {
    if (request.failure()?.errorText === NETWORK_CHANGED) networkChanged = true;
  };
  page.on('requestfailed', watch);

  try {
    await boot(page);
  } catch (error) {
    if (!networkChanged) throw withPageErrors(error, errors);
  } finally {
    page.off('requestfailed', watch);
  }
  return networkChanged;
}

function reportVoidedBoot(attempt, next) {
  console.warn(`[browser harness] ${NETWORK_CHANGED} during page load ${attempt}/${NETWORK_CHANGE_ATTEMPTS}; ${next}`);
}

function networkGaveUp() {
  return new Error(`the host network changed under ${NETWORK_CHANGE_ATTEMPTS} consecutive page loads (${NETWORK_CHANGED})`);
}

/** A boot failure names what the page itself reported, so a timeout is never mute. */
function withPageErrors(error, errors) {
  if (errors.length > 0) error.message += `\npage errors: ${errors.join(' | ')}`;
  return error;
}

/**
 * A fresh page on an arbitrary served fixture, booted to a mounted root.
 *
 * The readiness signal is the root blit on `window.cloudcanvas`, never the load
 * event.
 *
 * @param {string} fixturePath server-root-relative path, e.g. `/tests/browser/fixtures/core.html`
 * @returns {Promise<{page: object, errors: string[]}>}
 */
export function openFixturePage(browser, url, fixturePath, pageOptions = {}) {
  return openBootedPage(browser, {
    pageOptions: { viewport: { width: 1280, height: 800 }, ...pageOptions },
    boot: async (page) => {
      await page.goto(`${url}${fixturePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 10000 });
    }
  });
}

/**
 * The ids a blit shares with another element of the document. A blit's id is its
 * element's `id`, so one colliding with page chrome (or another canvas) makes
 * `#id`, `getElementById` and `[data-blit][id]` ambiguous.
 * @returns {Promise<string[]>} each shared id once
 */
export function duplicateBlitIds(page) {
  return page.evaluate(() => {
    const counts = new Map();
    for (const element of document.querySelectorAll('[id]')) counts.set(element.id, (counts.get(element.id) || 0) + 1);
    const blitIds = Array.from(document.querySelectorAll('[data-blit][id]'), (element) => element.id);
    return Array.from(new Set(blitIds.filter((id) => counts.get(id) > 1)));
  });
}

/** Throw when any blit id is shared (see {@link duplicateBlitIds}); every harness boot and reload asserts it. */
export async function assertUniqueBlitIds(page) {
  const shared = await duplicateBlitIds(page);
  if (shared.length > 0) throw new Error(`blit ids shared with other elements: ${shared.join(', ')}`);
}

/** Let the rAF loop run for `ms`; a root is only observable across frames. */
export function frames(page, ms) {
  return page.waitForTimeout(ms);
}

/** Read a blit's global bounds `{x, y, w, h}` out of the live root (`window.cloudcanvas`). */
export function boundsOf(page, blitId) {
  return page.evaluate((id) => {
    const found = window.cloudcanvas.find(id);
    return found ? found.bounds : null;
  }, blitId);
}
