/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * cloudcanvas/testing: seams for driving the core from a test. `runFrame`
 * runs one frame of a root synchronously, `loopStep` one turn of the loop,
 * `needsFrame` reports the idle rule; `SPEC_KINDS` is the spec codec's kind
 * table. Not for pages: nothing here is needed at runtime.
 */

export { loopStep, needsFrame, runFrame } from './core/frame.js';
export { SPEC_KINDS } from './core/spec.js';
