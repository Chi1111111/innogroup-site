import { afterEach, expect, it, vi } from 'vitest';
import { loadCollectionReport } from './japanMarketSync';

afterEach(() => vi.unstubAllGlobals());
function responses(history: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 100, refreshedAt: '2026-09-06T17:02:15Z' }) })
    .mockResolvedValueOnce(history));
}
it('shows an honest empty history before the first instrumented run', async () => {
  responses({ ok: false, status: 404 });
  expect(await loadCollectionReport()).toMatchObject({ count: 100, runs: [] });
});
it('does not present a failed report fetch as an empty successful history', async () => {
  responses({ ok: false, status: 500 });
  await expect(loadCollectionReport()).rejects.toThrow('无法读取采集历史');
});
it('rejects malformed run entries before rendering', async () => {
  responses({ ok: true, status: 200, json: async () => ({ runs: [null] }) });
  await expect(loadCollectionReport()).rejects.toThrow('采集历史格式异常');
});
