/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for Vectorizer Subsystem.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simplifyPoints,
  vectorizeStroke,
  vectorizeContour,
  normalizePathTopology
} from '../../graphics/vectorizer.js';

test('vectorizer - simplifyPoints preserves small sets and filters collinear points', () => {
  assert.deepEqual(simplifyPoints([]), []);
  assert.deepEqual(simplifyPoints([{ x: 0, y: 0 }]), [{ x: 0, y: 0 }]);
  
  const collinear = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 }
  ];
  const simplified = simplifyPoints(collinear, 1.0);
  assert.equal(simplified.length, 2);
  assert.deepEqual(simplified[0], { x: 0, y: 0 });
  assert.deepEqual(simplified[1], { x: 30, y: 0 });
});

test('vectorizer - vectorizeStroke handles edge cases gracefully', () => {
  assert.equal(vectorizeStroke([]), '');
  assert.equal(vectorizeStroke(null), '');

  const single = vectorizeStroke([{ x: 10, y: 20 }]);
  assert.match(single, /^M 10\.00 20\.00 L/);

  const pair = vectorizeStroke([{ x: 10, y: 10 }, { x: 50, y: 50 }]);
  assert.equal(pair, 'M 10.00 10.00 L 50.00 50.00');
});

test('vectorizer - vectorizeStroke generates smooth cubic beziers for point sequences', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 20, y: 40 },
    { x: 60, y: 30 },
    { x: 100, y: 80 }
  ];
  const path = vectorizeStroke(points, { tolerance: 0 });
  assert.match(path, /^M 0\.00 0\.00/);
  // Contains cubic bezier 'C' commands
  const cCount = (path.match(/ C /g) || []).length;
  assert.equal(cCount, 3);
  assert.equal(path.includes('Z'), false);

  const closed = vectorizeStroke(points, { tolerance: 0, closed: true });
  assert.equal(closed.endsWith(' Z'), true);
  assert.equal((closed.match(/ C /g) || []).length, 4);
});

test('vectorizer - vectorizeContour generates closed radial loop', () => {
  const radii = [40, 50, 60, 45, 55, 40, 50, 45];
  const contour = vectorizeContour(radii, 100, 100);
  assert.match(contour, /^M /);
  assert.equal(contour.endsWith(' Z'), true);
  const cCount = (contour.match(/ C /g) || []).length;
  assert.equal(cCount, radii.length);
});

test('vectorizer - normalizePathTopology guarantees identical command counts for CSS morphing', () => {
  const targetSegments = 16;

  // 1. Irregular radial sculpt shape
  const radiiA = [30, 60, 40, 70, 35, 80, 50, 60];
  const shapeA = vectorizeContour(radiiA, 100, 100);
  const normA = normalizePathTopology(shapeA, targetSegments);

  // 2. Different shape with different point count
  const radiiB = [50, 50, 50, 50, 50];
  const shapeB = vectorizeContour(radiiB, 100, 100);
  const normB = normalizePathTopology(shapeB, targetSegments);

  // Both must have exactly targetSegments 'C' commands and 'Z'
  const cCountA = (normA.match(/ C /g) || []).length;
  const cCountB = (normB.match(/ C /g) || []).length;

  assert.equal(cCountA, targetSegments);
  assert.equal(cCountB, targetSegments);
  assert.equal(normA.endsWith(' Z'), true);
  assert.equal(normB.endsWith(' Z'), true);

  // Fallback generation for empty or invalid input produces targetSegments
  const fallback = normalizePathTopology('', targetSegments);
  assert.equal((fallback.match(/ C /g) || []).length, targetSegments);
});
