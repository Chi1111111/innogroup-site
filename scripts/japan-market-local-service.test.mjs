import { request as httpRequest } from 'node:http';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createLocalService } from './japan-market-local-service.mjs';

test('local service rejects foreign origins/tokens and prevents concurrent scans', async () => {
  let starts = 0;
  const child = new EventEmitter();
  const { server } = createLocalService({ token: 'test-pairing', launch: () => { starts++; return child; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const call = (path, method = 'GET', overrides = {}) => fetch(url + path, { method, headers: { Host: `127.0.0.1:${server.address().port}`, Origin: 'https://www.innogroup.co.nz', Authorization: 'Bearer test-pairing', ...overrides } });
  try {
    assert.equal((await call('/scan', 'POST', { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await call('/scan', 'POST', { Authorization: 'Bearer wrong' })).status, 401);
    assert.equal(await new Promise((resolve, reject) => { const req = httpRequest(url + '/scan', { method: 'POST', headers: { Host: 'evil.example', Origin: 'https://www.innogroup.co.nz', Authorization: 'Bearer test-pairing' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); }), 403);
    assert.equal((await call('/scan', 'OPTIONS')).status, 204);
    assert.equal(starts, 0);
    assert.equal((await call('/scan', 'POST')).status, 202);
    assert.equal((await call('/scan', 'POST')).status, 409);
    assert.equal(starts, 1);
    assert.equal((await (await call('/status')).json()).status, 'running');
    child.emit('close', 0);
    assert.equal((await (await call('/status')).json()).status, 'finished');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
