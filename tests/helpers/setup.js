/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Test harness bootstrap.
 *
 * Installs a real DOM (happy-dom) into the Node global scope *before* any test
 * module is imported. Wired through `node --test --import ./tests/helpers/setup.js`,
 * so production sources see the same `document` / `window` / `requestAnimationFrame`
 * contract they see in a browser -- no in-source DOM stubs required.
 *
 * happy-dom is a devDependency only; the runtime library keeps zero dependencies.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 768;

const REQUIRED_GLOBALS = [
  'window',
  'document',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle',
  'CustomEvent',
  'Event',
  'EventTarget',
  'Node',
  'HTMLElement'
];

if (!GlobalRegistrator.isRegistered) {
  GlobalRegistrator.register({
    url: 'http://localhost/',
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT
  });
}

const missing = REQUIRED_GLOBALS.filter((name) => typeof globalThis[name] === 'undefined');
if (missing.length > 0) {
  throw new Error(`Test harness: happy-dom did not register required globals: ${missing.join(', ')}`);
}
