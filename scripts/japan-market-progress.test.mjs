import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';

const source = ts.transpileModule(readFileSync(new URL('../supabase/functions/japan-market-progress/index.ts', import.meta.url), 'utf8').replace(/^import .*;$/gm, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
function setup({ authorized = true, githubFailure = false, databaseFailure = false } = {}) {
  let handler;
  const query = (table) => {
    const result = { data: table === 'japan_photo_settings' ? { processing_enabled: true, worker_seen_at: '2026-09-27T10:00:00Z' } : [{ id: '1', make: 'Toyota', model: 'Aqua', registered_at: '2026-09-27T10:00:00Z' }], error: databaseFailure ? new Error('private database failure') : null };
    const chain = { select: () => chain, eq: () => chain, in: () => chain, gte: () => chain, order: () => chain, single: () => Promise.resolve(result), limit: () => Promise.resolve(result) };
    return chain;
  };
  const client = { from: vi.fn(query), rpc: vi.fn(async (name) => ({ data: name === 'japan_market_dispatch_credential' ? 'private-token-fixture' : { queued: 7 }, error: null })) };
  const fetch = vi.fn(async (url) => {
    if (githubFailure) throw new Error('private github failure');
    return Response.json(url.includes('checkpoint.json') ? { savedAt: '2026-09-27T10:00:00Z', writer: { runId: 'run-1' }, pending: ['1', '2'], cursor: { make: 'Toyota', page: 3, deferred: ['not-needed'] } } : { runs: [{ id: 'old-run', status: 'success', finishedAt: '2026-09-26T10:00:00Z', metrics: { accepted: 12, activeRequests: ['not-needed'] } }] });
  });
  vm.runInNewContext(source, { Deno: { serve: fn => { handler = fn; }, env: { get: () => 'configured' } }, createClient: () => client, verifyAdminSession: async () => authorized, jsonResponse: (_req, body, status = 200) => Response.json(body, { status }), corsHeaders: () => ({}), Response, fetch, AbortSignal, Date });
  return { invoke: (method = 'POST') => handler(new Request('https://example.test', { method })), client, fetch };
}
it('rejects unauthorized access before reading any cloud data', async () => {
  const test = setup({ authorized: false });
  expect((await test.invoke()).status).toBe(401);
  expect(test.client.rpc).not.toHaveBeenCalled();
  expect(test.fetch).not.toHaveBeenCalled();
});
it('returns only bounded monitor data without credentials or pending records', async () => {
  const test = setup();
  const result = await (await test.invoke()).json();
  expect(result.data.checkpoint.pending).toBe(2);
  expect(result.data.counts.queued).toBe(7);
  expect(result.data.recent[0].make).toBe('Toyota');
  expect(result.data.warnings).toEqual([]);
  expect(JSON.stringify(result)).not.toContain('private-token');
  expect(JSON.stringify(result)).not.toContain('not-needed');
});
it('preserves database progress when GitHub is unavailable', async () => {
  const result = await (await setup({ githubFailure: true }).invoke()).json();
  expect(result.data.checkpoint).toBeNull();
  expect(result.data.recent).toHaveLength(1);
  expect(result.data.warnings).toHaveLength(2);
});
it('preserves checkpoint progress when database queries fail', async () => {
  const result = await (await setup({ databaseFailure: true }).invoke()).json();
  expect(result.data.checkpoint.pending).toBe(2);
  expect(result.data.settings).toBeNull();
  expect(result.data.recent).toBeNull();
  expect(result.data.warnings).toHaveLength(6);
});
it('rejects unsupported methods without contacting providers', async () => {
  const test = setup();
  expect((await test.invoke('GET')).status).toBe(405);
  expect((await test.invoke('OPTIONS')).status).toBe(200);
  expect(test.fetch).not.toHaveBeenCalled();
});
