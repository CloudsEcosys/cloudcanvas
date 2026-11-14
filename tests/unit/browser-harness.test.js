/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The browser harness's static server survives a file it cannot read: the
 * request gets a 500 and the next request is still served.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { startStaticServer } from '../browser/harness.js';

/** GET `url` with Node's own client (the test DOM replaces `fetch`); a reset or a stall rejects. */
function get(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: 2000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
      response.on('error', reject);
    });
    request.on('timeout', () => request.destroy(new Error(`${url} timed out`)));
    request.on('error', reject);
  });
}

test('harness server - an unreadable file is a 500 and the server keeps serving', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cloudcanvas-harness-'));
  fs.writeFileSync(path.join(root, 'ok.txt'), 'ok');
  fs.writeFileSync(path.join(root, 'locked.txt'), 'locked');
  fs.chmodSync(path.join(root, 'locked.txt'), 0o000);
  const server = await startStaticServer(root);
  t.after(async () => {
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  });

  assert.deepEqual(await get(`${server.url}/locked.txt`), { status: 500, body: 'Server error' });
  assert.deepEqual(await get(`${server.url}/ok.txt`), { status: 200, body: 'ok' });
});
