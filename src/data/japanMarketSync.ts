export interface CollectionRun {
  id: string;
  source: string;
  trigger: string;
  startedAt: string | null;
  finishedAt: string;
  durationSeconds: number | null;
  status: 'success' | 'partial' | 'failed' | 'cancelled';
  error: string | null;
  workflowUrl: string | null;
  metrics: Partial<Record<'pagesExpected' | 'pagesFetched' | 'received' | 'accepted' | 'rejected' | 'detailRequested' | 'detailSucceeded' | 'detailFailed' | 'detailSkipped' | 'requests' | 'added' | 'removed', number | null>> & {
    stage?: string;
    published?: boolean;
    timedOut?: boolean;
    lastProgressAt?: string;
    activeRequests?: string[];
    rejectionReasons?: Record<string, number>;
  };
}

export interface CollectionReport {
  count: number;
  refreshedAt: string;
  runs: CollectionRun[];
}

export async function loadCollectionReport(): Promise<CollectionReport> {
  const [manifestResponse, historyResponse] = await Promise.all([
    fetch('/data/japan-market/manifest.json', { cache: 'no-store' }),
    fetch('/data/japan-market/sync-history.json', { cache: 'no-store' }),
  ]);
  if (!manifestResponse.ok) throw new Error('无法读取当前车源状态，请稍后重试。');
  const manifest = await manifestResponse.json();
  if (!Number.isFinite(manifest.count) || !Number.isFinite(Date.parse(manifest.refreshedAt))) {
    throw new Error('当前车源状态格式异常。');
  }
  if (historyResponse.status === 404) return { ...manifest, runs: [] };
  if (!historyResponse.ok) throw new Error('无法读取采集历史，请稍后重试。');
  const history = await historyResponse.json();
  if (!Array.isArray(history.runs) || !history.runs.every((run: unknown) => {
    if (!run || typeof run !== 'object') return false;
    const value = run as CollectionRun;
    return typeof value.id === 'string'
      && ['success', 'partial', 'failed', 'cancelled'].includes(value.status)
      && typeof value.finishedAt === 'string'
      && value.metrics && typeof value.metrics === 'object'
      && (value.workflowUrl == null || typeof value.workflowUrl === 'string');
  })) throw new Error('采集历史格式异常。');
  return { ...manifest, runs: history.runs };
}
