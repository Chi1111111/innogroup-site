import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
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
  expect(execute('--finalize').status).toBe(0);
  expect(read('sync-history.json').runs[0]).toMatchObject({ status: 'cancelled', startedAt: null });
}, 15000);
