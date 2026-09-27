import { expect, it } from 'vitest';
import { collectionSignal, type ProgressSnapshot } from './MacCollectionProgress';

const now = Date.parse('2026-09-27T10:30:00Z');
const empty: ProgressSnapshot = { fetchedAt: new Date(now).toISOString(), checkpoint: null, latestRun: null, settings: null, counts: null, recent: [], warnings: [] };
it('does not treat a fresh response or image heartbeat as collector activity', () => {
  expect(collectionSignal({ ...empty, settings: { processing_enabled: true, worker_seen_at: new Date(now).toISOString() } }, now)).toBe('暂无近期采集信号');
});
it('shows recent registrations even if checkpoint service is unavailable', () => {
  expect(collectionSignal({ ...empty, recent: [{ id: '1', make: 'Toyota', model: 'Aqua', registered_at: '2026-09-27T10:29:30Z' }] }, now)).toBe('最近有采集进展');
});
it('expires an unchanged checkpoint and rejects future or invalid timestamps', () => {
  for (const savedAt of ['2026-09-27T10:25:00Z', '2026-09-27T11:00:00Z', 'invalid']) {
    expect(collectionSignal({ ...empty, checkpoint: { savedAt, pending: 10 } }, now)).toBe('暂无近期采集信号');
  }
});
it('distinguishes a completed run from progress after that run', () => {
  const data: ProgressSnapshot = { ...empty, checkpoint: { savedAt: '2026-09-27T10:29:00Z', runId: 'run-1', pending: 0 }, latestRun: { id: 'run-1', finishedAt: '2026-09-27T10:29:15Z', status: 'success', error: null, metrics: {} } };
  expect(collectionSignal(data, now)).toBe('本轮已有结束记录');
  data.recent = [{ id: '2', make: 'Toyota', model: 'Aqua', registered_at: '2026-09-27T10:29:30Z' }];
  expect(collectionSignal(data, now)).toBe('最近有采集进展');
});
it('distinguishes missing data from a successful empty activity list', () => {
  expect(collectionSignal({ ...empty, recent: null }, now)).toBe('采集数据暂不可用');
  expect(collectionSignal(empty, now)).toBe('暂无近期采集信号');
});
