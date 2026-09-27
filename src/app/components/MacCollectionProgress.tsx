import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { invokeAdminFunction } from '../lib/adminApi';
import type { CollectionRun } from '../../data/japanMarketSync';

export interface ProgressSnapshot {
  fetchedAt: string;
  checkpoint: { savedAt: string; runId?: string; pending: number | null; cursor?: { make?: string; model?: string; page?: number; cycle?: number } } | null;
  latestRun: Pick<CollectionRun, 'id' | 'finishedAt' | 'status' | 'error' | 'metrics'> | null;
  settings: { processing_enabled: boolean; worker_seen_at: string | null } | null;
  counts: Record<string, number> | null;
  recent: { id: string; registered_at: string; make: string; model: string }[] | null;
  warnings: string[];
}
export function collectionSignal(data: ProgressSnapshot, now: number) {
  if (!data.checkpoint && data.recent === null) return '采集数据暂不可用';
  const checkpoint = data.checkpoint;
  const finished = data.latestRun;
  const registeredAt = Date.parse(data.recent?.[0]?.registered_at ?? '');
  const completed = checkpoint && finished && checkpoint.runId === finished.id && Date.parse(finished.finishedAt) >= Date.parse(checkpoint.savedAt) && !(registeredAt > Date.parse(finished.finishedAt));
  if (completed) return '本轮已有结束记录';
  const signals = [checkpoint?.savedAt, data.recent?.[0]?.registered_at].map(v => Date.parse(v ?? '')).filter(Number.isFinite);
  return signals.some(time => now - time >= 0 && now - time < 180000) ? '最近有采集进展' : '暂无近期采集信号';
}
const time = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Pacific/Auckland', hour12: false }) : '尚无记录';
const count = (value?: number | null) => value == null ? '—' : value.toLocaleString();

export function MacCollectionProgress() {
  const [data, setData] = useState<ProgressSnapshot | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      setLoading(true);
      try {
        const result = await invokeAdminFunction<ProgressSnapshot>('japan-market-progress', {}, AbortSignal.any([controller.signal, AbortSignal.timeout(25000)]));
        if (active) { setData(result); setError(''); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : '进度读取失败'); }
      finally { if (active) { setLoading(false); setNow(Date.now()); timer = setTimeout(() => { void refresh(); }, 15000); } }
    }
    void refresh();
    const clock = setInterval(() => setNow(Date.now()), 15000);
    return () => { active = false; controller.abort(); clearTimeout(timer); clearInterval(clock); };
  }, [revision]);
  const outdated = !!data && now - Date.parse(data.fetchedAt) > 60000;
  const checkpoint = data?.checkpoint;
  const cursor = checkpoint?.cursor;
  const photoSeen = Date.parse(data?.settings?.worker_seen_at ?? '');
  const photoRecent = Number.isFinite(photoSeen) && now - photoSeen < 180000 && now >= photoSeen;
  return <section className="ajm-panel ajm-live" aria-label="Mac 云端进度">
    <div className="ajm-panel-heading"><div><p className="ajm-eyebrow">MAC MINI · CLOUD ACTIVITY</p><h2>采集与图片处理进展</h2><p>每 15 秒读取云端 · 采集断点通常约 1 分钟更新 · 新西兰时间</p></div><button className="ajm-button" disabled={loading} onClick={() => setRevision(v => v + 1)}><RefreshCw size={16} className={loading ? 'ajm-spin' : ''}/>{loading ? '同步中…' : '立即同步'}</button></div>
    {error && <p role="alert" className="ajm-alert danger">{error}。{data ? '下方保留上次成功读取的数据。' : '尚未取得云端进度。'}</p>}
    {outdated && <p role="status" className="ajm-alert warning">面板数据已超过一分钟未同步，请勿将旧数据作为当前进度。</p>}
    {!data && !error && <p role="status">正在连接云端…</p>}
    {data && <>
      <div className="ajm-live-grid">
        <article><span className="ajm-eyebrow">01 · 日本车源</span><h3>{error || outdated ? '等待重新确认' : collectionSignal(data, now)}</h3><p className="ajm-live-position">{cursor ? `${cursor.make ?? '待记录'} / ${cursor.model ?? '待记录'}` : '等待采集断点'}</p><p>第 {count(cursor?.cycle)} 轮 · 第 {count(cursor?.page)} 页</p><strong>{count(checkpoint?.pending)} <small>辆断点暂存</small></strong><p>断点保存：{time(checkpoint?.savedAt)}</p><small>暂无信号可能是等待下一轮、源站限流或离线；云端无法直接确认本机进程。</small></article>
        <article><span className="ajm-eyebrow">02 · 图片处理 · 全部来源</span><h3>{!data.settings ? '状态暂不可用' : !data.settings.processing_enabled ? '云端处理已暂停' : photoRecent ? '最近收到工作心跳' : '等待工作心跳'}</h3><dl className="ajm-live-counts">{[['等待处理','queued'],['正在处理','processing'],['处理完成','approved'],['失败','failed']].map(([label,key]) => <div key={key}><dt>{label}</dt><dd>{count(data.counts ? data.counts[key] ?? 0 : null)}</dd></div>)}</dl><p>工作心跳：{time(data.settings?.worker_seen_at)}</p><small>图片失败排到队尾，累计失败 3 次停止；其余合格图片可上架。心跳为全部图片任务的云端信号。</small></article>
      </div>
      {data.warnings.map(warning => <p key={warning} className="ajm-alert warning">{warning}；对应项目不代表零进度。</p>)}
      <div className="ajm-panel-heading"><div><h3>最近登记的车辆</h3><p>车辆通过校验并登记到图片队列后显示；登记不等于已上架。</p></div><span>本次同步：{time(data.fetchedAt)}</span></div>
      <div className="ajm-table-scroll"><table><thead><tr><th>车辆</th><th>编号</th><th>云端登记时间</th></tr></thead><tbody>{data.recent?.map(vehicle => <tr key={vehicle.id}><td>{vehicle.make} {vehicle.model}</td><td>{vehicle.id}</td><td>{time(vehicle.registered_at)}</td></tr>)}</tbody></table></div>
      {data.recent?.length === 0 && <p>尚无登记车辆。</p>}
      {data.latestRun && <div className="ajm-live-last"><p>最近结束记录：{time(data.latestRun.finishedAt)} · {({success:'成功',partial:'部分完成',failed:'失败',cancelled:'已取消'})[data.latestRun.status]} · 有效车源 {count(data.latestRun.metrics.accepted)} 辆</p>{data.latestRun.error && <details><summary>最近任务有异常 · 查看详情</summary><p>{data.latestRun.error}</p></details>}</div>}
    </>}
  </section>;
}
