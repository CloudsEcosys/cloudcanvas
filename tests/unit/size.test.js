/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The size gate (`scripts/size.js --check`) fails on growth, on an entry the
 * baseline has no row for, and on a baseline row no entry measures.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { findFailures } from '../../scripts/size.js';

const BASELINE = Object.freeze({ full: { min: 100, gzip: 50 }, log: { min: 10, gzip: 5 } });

test('size check - equal or smaller rows pass', () => {
  const rows = [{ name: 'full', min: 100, gzip: 49 }, { name: 'log', min: 9, gzip: 5 }];
  assert.deepEqual(findFailures(rows, BASELINE), []);
});

test('size check - a metric that grew fails', () => {
  const rows = [{ name: 'full', min: 101, gzip: 50 }, { name: 'log', min: 10, gzip: 5 }];
  assert.deepEqual(findFailures(rows, BASELINE), ['full min: 100 -> 101 (+1 B)']);
});

test('size check - an entry with no baseline row fails', () => {
  const rows = [{ name: 'full', min: 100, gzip: 50 }, { name: 'log', min: 10, gzip: 5 }, { name: 'theme', min: 1, gzip: 1 }];
  assert.deepEqual(findFailures(rows, BASELINE), ['theme: no baseline row']);
});

test('size check - a baseline row with no entry fails', () => {
  const rows = [{ name: 'full', min: 100, gzip: 50 }];
  assert.deepEqual(findFailures(rows, BASELINE), ['log: baseline row with no entry']);
});
