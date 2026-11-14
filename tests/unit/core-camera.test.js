/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The core camera: the view matrix, pan and zoom, the snapping fit behind
 * `view()`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera } from '../../core/camera.js';
import { blit } from '../../core/index.js';
import { stateOf } from '../../core/state.js';
import { runFrame } from '../../core/frame.js';
import { resetDocument } from '../helpers/dom.js';

test('matrix - a 4x4 column-major view: scale on the diagonal, translation in the last column', () => {
  const camera = new Camera({ x: -400, y: -150, scale: 2.5 });
  const m = camera.matrix;

  assert.ok(m instanceof Float64Array);
  assert.equal(m.length, 16);
  assert.deepEqual(Array.from(m), [2.5, 0, 0, 0, 0, 2.5, 0, 0, 0, 0, 1, 0, -400, -150, 0, 1]);
  assert.notEqual(camera.matrix, m, 'each read is a fresh array');

  // M * [cx, cy, 0, 1] is where the plane transform puts a canvas point.
  assert.deepEqual([m[0] * 200 + m[12], m[5] * 100 + m[13]], [200 * 2.5 - 400, 100 * 2.5 - 150]);
});

test('fit - snaps to the camera that frames a box, and returns it', () => {
  const camera = new Camera();
  const resolved = camera.fit({ x: 100, y: 100, width: 240, height: 160 }, { width: 1024, height: 768 });

  // Padding 60 leaves 904x648; 904/240 = 3.77, 648/160 = 4.05, capped by maxZoom 2.5.
  assert.equal(resolved.scale, 2.5);
  assert.equal(resolved.x, 1024 / 2 - 220 * 2.5);
  assert.equal(resolved.y, 768 / 2 - 180 * 2.5);
  assert.deepEqual({ x: camera.x, y: camera.y, scale: camera.scale }, resolved);
  assert.equal(camera.isAnimating, undefined, 'the core camera has no motion');

  // fitTarget is the same answer without the move; a DOMRect-like box reads too.
  const still = new Camera();
  assert.deepEqual(still.fitTarget({ left: 100, top: 100, right: 340, bottom: 260 }, { width: 1024, height: 768 }), resolved);
  assert.deepEqual([still.x, still.y, still.scale], [0, 0, 1]);

  assert.throws(() => camera.fit(null), /bounds must be a box object/);
  assert.throws(() => camera.fit({ x: 1 }), /bounds needs/);
});

test('pan and zoom - zoomAt keeps the focal point fixed; setZoom clamps', () => {
  const camera = new Camera({ minScale: 0.5, maxScale: 2 });
  camera.panBy(10, 20);
  assert.deepEqual([camera.x, camera.y], [10, 20]);

  const canvasAt = (sx, sy) => [(sx - camera.x) / camera.scale, (sy - camera.y) / camera.scale];
  const before = canvasAt(300, 200);
  camera.zoomAt(1.5, 300, 200);
  const after = canvasAt(300, 200);
  assert.ok(Math.abs(before[0] - after[0]) < 1e-9 && Math.abs(before[1] - after[1]) < 1e-9);

  camera.setZoom(10);
  assert.equal(camera.scale, 2);
  camera.setZoom(0.01);
  assert.equal(camera.scale, 0.5);
});

test('view - a root snaps to a blit\'s global bounds and writes the plane transform next frame', (t) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  t.after(resetDocument);

  const app = blit(host);
  const card = app.blit({ x: 100, y: 100, w: 240, h: 160 });
  const kid = card.blit({ x: 10, y: 10, w: 20, h: 20 });
  const root = stateOf(host).root;

  // happy-dom lays out nothing, so the host falls back to the 800x600 frame.
  const resolved = app.view(kid);
  const expected = new Camera().fitTarget({ x: 110, y: 110, width: 20, height: 20 }, { width: 800, height: 600 });
  assert.deepEqual(resolved, expected);
  assert.deepEqual({ x: root.camera.x, y: root.camera.y, scale: root.camera.scale }, expected);
  assert.equal(root.plane.style.transform, '');

  runFrame(root, 1);
  assert.equal(root.plane.style.transform, `translate3d(${resolved.x.toFixed(2)}px, ${resolved.y.toFixed(2)}px, 0.00px) scale(2.5000)`);

  // A selector or an element frames the same blit.
  assert.deepEqual(card.view(kid.el), expected);
});

const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('camera 3D - flat by default: view is the flat matrix, project/unproject are the 2D maps', () => {
  const camera = new Camera({ x: 30, y: -10, scale: 2 });
  assert.equal(camera.is3d, false);
  assert.deepEqual(Array.from(camera.view()), Array.from(camera.matrix));
  assert.deepEqual(camera.project(5, 7), { x: 40, y: 4 });
  assert.deepEqual(camera.unproject(40, 4), { x: 5, y: 7 });
});

test('camera 3D - through tilt and perspective, unproject inverts project on the canvas plane', () => {
  const host = { width: 1000, height: 700 };
  const camera = new Camera({ x: 40, y: 25, scale: 1.5, perspective: 900, rotateX: 25, rotateY: -35 });
  assert.equal(camera.is3d, true);
  for (const [px, py] of [[0, 0], [120, -40], [640, 480], [-300, 900]]) {
    const at = camera.project(px, py, host);
    const back = camera.unproject(at.x, at.y, host);
    assert.ok(close(back.x, px, 1e-6) && close(back.y, py, 1e-6), `(${px}, ${py}) came back as (${back.x}, ${back.y})`);
  }
  const centre = camera.unproject(500, 350, host);
  const onScreen = camera.project(centre.x, centre.y, host);
  assert.ok(close(onScreen.x, 500) && close(onScreen.y, 350), 'the host centre does not round-trip');
});

test('camera 3D - nothing behind the viewer: project and unproject answer null past the horizon', () => {
  const host = { width: 1280, height: 720 };
  const camera = new Camera({ perspective: 300, rotateY: 75 });
  const answers = [0, 250, 500, 1000, 1280].map((x) => camera.project(x, 360, host));
  assert.ok(answers.some((at) => at === null), 'part of so steep a board is behind the viewer');
  for (const at of answers.filter(Boolean)) assert.ok(Number.isFinite(at.x) && Number.isFinite(at.y));
  const seen = answers.filter(Boolean).map((at) => at.x);
  assert.deepEqual(seen, [...seen].sort((a, b) => a - b), 'what is in front stays in order: nothing folds');

  const tilted = new Camera({ perspective: 800, rotateX: 75 }); // horizon at y = 300 - 800 / tan 75° ≈ 86
  assert.equal(tilted.unproject(400, 5, { width: 800, height: 600 }), null, 'above the horizon, no canvas');
  const below = tilted.unproject(400, 500, { width: 800, height: 600 });
  const back = tilted.project(below.x, below.y, { width: 800, height: 600 });
  assert.ok(close(back.x, 400) && close(back.y, 500));
});

test('camera 3D - zoomAt given the host box keeps the canvas point under a tilted focal point; past the horizon, no zoom', () => {
  const host = { width: 1000, height: 700 };
  const camera = new Camera({ perspective: 900, rotateX: 40, rotateY: -20 });
  const grabbed = camera.unproject(800, 150, host);
  camera.zoomAt(1.5, 800, 150, host);
  assert.equal(camera.scale, 1.5);
  const at = camera.project(grabbed.x, grabbed.y, host);
  assert.ok(close(at.x, 800, 1e-6) && close(at.y, 150, 1e-6), `the focal point drifted to (${at.x}, ${at.y})`);
  camera.zoomAt(1 / 1.5, 800, 150, host);
  const back = camera.project(grabbed.x, grabbed.y, host);
  assert.ok(close(back.x, 800, 1e-6) && close(back.y, 150, 1e-6), 'and back out');

  const steep = new Camera({ perspective: 800, rotateX: 75 });
  steep.zoomAt(2, 400, 5, { width: 800, height: 600 });
  assert.deepEqual([steep.x, steep.y, steep.scale], [0, 0, 1], 'a focal point above the horizon zoomed');

  const flat = new Camera({ x: 10, y: 20 });
  const reference = new Camera({ x: 10, y: 20 });
  flat.zoomAt(1.5, 300, 200, host);
  reference.zoomAt(1.5, 300, 200);
  assert.deepEqual([flat.x, flat.y, flat.scale], [reference.x, reference.y, reference.scale], 'flat, the box changes nothing');
});

test('camera 3D - a tilted root writes matrix3d on the plane and the perspective on the host', (t) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  t.after(resetDocument);
  blit(host);
  const root = stateOf(host).root;

  Object.assign(root.camera, { perspective: 1000, rotateX: 20 });
  runFrame(root, 1);
  assert.match(root.plane.style.transform, /^matrix3d\(/);
  assert.equal(root.plane.style.transformStyle, 'preserve-3d');
  assert.equal(host.style.perspective, '1000px');

  Object.assign(root.camera, { perspective: null, rotateX: 0 });
  runFrame(root, 1);
  assert.match(root.plane.style.transform, /^translate3d\(/);
  assert.equal(root.plane.style.transformStyle, '');
  assert.equal(host.style.perspective, '');
});
