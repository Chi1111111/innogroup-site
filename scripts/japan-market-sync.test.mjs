import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { afterEach, expect, it } from 'vitest';

const runner = fileURLToPath(new URL('./run-japan-market-sync.mjs', import.meta.url));
const directories = [];
afterEach(() => { for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });
it('records success, rejected records, failure preservation and cancellation without calling the API', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inno-sync-test-'));
  directories.push(cwd);
  const input = path.join(cwd, 'input.json');
  const output = path.join(cwd, 'public/data/japan-market');
  const env = { ...process.env, CARAPIS_API_KEY: '', CARAPIS_API_KEY_FILE: '', CARAPIS_INPUT_FILE: '', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' };
  const execute = (...args) => spawnSync(process.execPath, [runner, ...args], { cwd, env, encoding: 'utf8' });
  const read = (file) => JSON.parse(fs.readFileSync(path.join(output, file), 'utf8'));
  fs.writeFileSync(input, JSON.stringify([
    ...Array.from({ length: 4 }, (_, i) => ({ id: `car-${i}`, brand_name: 'Toyota', model_name: 'Alphard', year: 2024, mileage: 1000 })),
    null,
  ]));
  const success = execute(`--input=${input}`);
  expect(success.status, success.stderr).toBe(0);
  expect(read('index.json').count).toBe(4);
  expect(read('sync-history.json').runs[0]).toMatchObject({ status: 'success', metrics: { accepted: 4, rejected: 1, requests: 0, published: true, rejectionReasons: { invalid_record: 1 } } });
  expect(execute('--finalize').status).toBe(0);
  expect(read('sync-history.json').runs).toHaveLength(1);
  const snapshot = fs.readFileSync(path.join(output, 'index.json'), 'utf8');
  env.GITHUB_RUN_ID = '124';
  fs.writeFileSync(input, '[]');
  expect(execute(`--input=${input}`).status).toBe(1);
  expect(read('sync-history.json').runs[0]).toMatchObject({ status: 'failed', metrics: { published: false, stage: 'validation' } });
  expect(fs.readFileSync(path.join(output, 'index.json'), 'utf8')).toBe(snapshot);
  env.GITHUB_RUN_ID = '125';
  env.SYNC_OUTCOME = 'cancelled';
  env.RUNNER_TEMP = path.join(cwd, 'runner-temp');
  fs.mkdirSync(env.RUNNER_TEMP);
  fs.writeFileSync(path.join(env.RUNNER_TEMP, 'japan-market-sync-125-1.json'), JSON.stringify({
    startedAt: '2026-09-08T17:55:04.000Z',
    metrics: { stage: 'listing', pagesExpected: 41, pagesFetched: 11, requests: 13, published: false },
  }));
  expect(execute('--finalize').status).toBe(0);
  expect(read('sync-history.json').runs[0]).toMatchObject({
    status: 'cancelled',
    startedAt: '2026-09-08T17:55:04.000Z',
    metrics: { stage: 'listing', pagesExpected: 41, pagesFetched: 11, requests: 13, published: false },
  });
}, 15000);

it('aborts a CARAPIS response whose body stops transferring', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inno-sync-timeout-test-'));
  directories.push(cwd);
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write('{"results":');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not expose a TCP port.');

  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [runner], {
        cwd,
        env: {
          ...process.env,
          CARAPIS_API_KEY: 'test-key',
          CARAPIS_API_URL: `http://127.0.0.1:${address.port}/vehicles/`,
          CARAPIS_MAX_RETRIES: '1',
          CARAPIS_REQUEST_TIMEOUT_MS: '1000',
          CARAPIS_COLLECTION_TIMEOUT_MS: '60000',
          GITHUB_RUN_ID: 'timeout-test',
          GITHUB_RUN_ATTEMPT: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.once('error', reject);
      child.once('close', (status) => resolve({ status, stdout, stderr }));
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
    expect(result.stderr).toContain('timed out after 1 seconds');
    const history = JSON.parse(fs.readFileSync(path.join(cwd, 'public/data/japan-market/sync-history.json'), 'utf8'));
    expect(history.runs[0]).toMatchObject({
      status: 'failed',
      metrics: { stage: 'listing', pagesFetched: 0, requests: 1, published: false },
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}, 10000);
