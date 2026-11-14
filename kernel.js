/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * cloudcanvas/kernel: the surface an add-on is written against. Pages import
 * `cloudcanvas` (`blit`, `type`); add-ons (cloudcanvas-lib, or your own) reach
 * the frame, the per-element state, the root index, the default port and the
 * spec codec through this entry and nothing deeper, so core files stay private.
 *
 * Every name here is one cloudcanvas-lib imports. Adding a name is a minor
 * change; removing or renaming one is breaking.
 */

export { blit, type } from './core/blit.js';
export { use } from './core/use.js';
export { FRAME_MS, schedule } from './core/frame.js';
export { injectStyle } from './core/css.js';
export { Camera, multiply } from './core/camera.js';
export { defaultPort, forgetPlacement, formatTransform3D } from './core/port.js';
export { attachBlit, findBlit, heldRootOf, indexBlit, releaseBlits } from './core/root.js';
export { camelCase, decodeAttribute, writeAttribute } from './core/spec.js';
export { findType, isTemplate } from './core/type.js';
export {
  BLIT_ATTR,
  MAX_DEPTH,
  ROOT_ATTR,
  SLOT_ATTR,
  SLOT_HTML_ATTR,
  boundsOf,
  childBlitsOf,
  holdPlace,
  isWithin,
  parentElementOf,
  parentNodeOf,
  parkedStateOf,
  rootOf,
  scopeContainerOf,
  sizeOf,
  stateOf
} from './core/state.js';
