import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { invokeAdminFunction } from '../lib/adminApi';
import { explainProblem, inLastDay, photoSteps } from './collectionLog';
import type { CollectionRun } from '../../data/japanMarketSync';

type PhotoRecord = { id:string;vehicle:string;status:string;failure_count?:number;error?:string;updated_at:string };
type PhotoRuntime = {active?:{id:string;stage:string}[]};
export interface ProgressSnapshot {
  fetchedAt: string;
  checkpoint: { savedAt: string; runId?: string; pending: number | null; cursor?: { make?: string; model?: string; page?: number; cycle?: number } } | null;
  latestRun: Pick<CollectionRun, 'id' | 'finishedAt' | 'status' | 'error' | 'metrics'> | null;
  runs?: NonNullable<ProgressSnapshot['latestRun']>[] | null;
  photoRecords?: PhotoRecord[] | null;
  activePhotos?: PhotoRecord[] | null;
  blockedPhotos?: PhotoRecord[] | null;
  photoErrors?: {id:number;vehicle:string;stage:string;message:string;created_at:string}[] | null;
  settings: { processing_enabled: boolean; worker_seen_at: string | null; mac_runtime?:PhotoRuntime; windows_runtime?:PhotoRuntime; pause_details?:{at?:string;reason?:string;message?:string}|null } | null;
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
  if (completed) return '上一轮找车已结束';
  const signals = [checkpoint?.savedAt, data.recent?.[0]?.registered_at].map(v => Date.parse(v ?? '')).filter(Number.isFinite);
  return signals.some(time => now - time >= 0 && now - time < 180000) ? '最近正在找车' : '暂未收到新的找车消息';
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
  const recent = data?.recent?.filter(vehicle => inLastDay(vehicle.registered_at,now)) ?? [];
  const runs = data?.runs?.filter(run => inLastDay(run.finishedAt,now)) ?? [];
  const records = data?.photoRecords?.filter(record => inLastDay(record.updated_at,now)) ?? [];
  const errors = data?.photoErrors?.filter(record => inLastDay(record.created_at,now)) ?? [];
  const active = data?.activePhotos ?? [];
  const steps = [...(data?.settings?.mac_runtime?.active ?? []), ...(data?.settings?.windows_runtime?.active ?? [])];
  const hasPosition = checkpoint && (inLastDay(checkpoint.savedAt,now) || (checkpoint.pending ?? 0)>0);
  const problem = (message:string) => <><p>{explainProblem(message)}</p><details className="ajm-log-raw"><summary>原始错误（供技术同事查看）</summary><pre>{message}</pre></details></>;
  return <section className="ajm-panel ajm-live" aria-label="采集与图片进度">
    <div className="ajm-panel-heading"><div><h2>现在进行到哪里了？</h2><p>每 15 秒自动更新，找车消息可能晚约 1 分钟。</p></div><button className="ajm-button" disabled={loading} onClick={() => setRevision(v => v + 1)}><RefreshCw size={16} className={loading ? 'ajm-spin' : ''}/>{loading ? '更新中…' : '刷新进度'}</button></div>
    {error && <p role="alert" className="ajm-alert danger">暂时无法读取进度。{data ? '下方是上次收到的消息，系统会自动重试。' : '系统会自动重试；如果一直失败，请重新登录。'}</p>}
    {outdated && <p role="status" className="ajm-alert warning">超过一分钟没有更新，下面的信息可能已经过时。</p>}
    {!data && !error && <p role="status">正在读取进度…</p>}
    {data && <>
      <div className="ajm-live-grid">
        <article><span className="ajm-eyebrow">第一步 · 找车</span><h3>{error || outdated ? '等待更新' : collectionSignal(data,now)}</h3>
          {hasPosition && <><p>上次看到的位置：<b>{cursor?.make} / {cursor?.model}</b>{cursor?.page ? `，第 ${cursor.page} 页` : ''}</p><p><strong>{count(checkpoint?.pending)}</strong> 辆车已保存进度，可继续处理</p></>}
          <p>没有新消息时，可能在等下一轮，也可能是 Mac 或网络需要检查；不能仅凭此判断已关机。</p>
        </article>
        <article><span className="ajm-eyebrow">第二步 · 处理图片</span><h3>{error || outdated ? '等待更新' : !data.settings ? '暂时无法读取' : !data.settings.processing_enabled ? '图片处理已暂停' : photoRecent ? '图片程序最近有回应' : '暂未收到图片程序的消息'}</h3>
          <dl className="ajm-live-counts">{[['等待处理','queued'],['正在处理','processing'],['等同事检查','pending_review']].map(([label,key]) => <div key={key}><dt>{label}</dt><dd>{count(data.counts ? data.counts[key] ?? 0 : null)} <small>张</small></dd></div>)}</dl>
          <p>失败图片自动排到最后再试，累计失败 3 次就跳过。其余合格图片仍可用于上架。</p>
        </article>
      </div>
      {data.settings && !data.settings.processing_enabled && <div className="ajm-alert warning"><p>图片处理已暂停。请先确认原因，再到下方点击“继续图片处理”。</p>{data.settings.pause_details?.message && problem(data.settings.pause_details.message)}</div>}
      {data.blockedPhotos?.map(item => <div className="ajm-alert warning" key={item.id}><b>{item.vehicle} · 需要处理</b>{problem(item.error ?? '')}</div>)}
      {data.warnings.map(warning => <p key={warning} className="ajm-alert warning">{warning}，暂时没有数据不代表任务数量为零。</p>)}
      <section className="ajm-log-section" aria-label="运行记录"><div className="ajm-panel-heading"><div><h2>运行记录</h2><p>已完成记录只看最近 24 小时，按收到的进度或记录更新时间显示。时间均为新西兰时间。</p></div><span>页面更新：{time(data.fetchedAt)}</span></div>
      <div className="ajm-log-columns">
        <section><h3>找车记录</h3>
          {checkpoint && inLastDay(checkpoint.savedAt,now) && <article className="ajm-log-item"><time>{time(checkpoint.savedAt)}</time><p>已保存 {cursor?.make} / {cursor?.model} 的找车进度，{count(checkpoint.pending)} 辆车可继续处理。</p></article>}
          {runs.map(run => <article className="ajm-log-item" key={run.id}><time>{time(run.finishedAt)}</time><p>{run.status==='success'?'这一轮找车完成':run.status==='partial'?'这一轮只完成了一部分':run.status==='cancelled'?'这一轮找车已取消':'这一轮找车遇到问题'}，找到 {count(run.metrics.accepted)} 辆符合条件的车。</p>{run.error && problem(run.error)}</article>)}
          {recent.map(vehicle => <article className="ajm-log-item" key={vehicle.id}><time>{time(vehicle.registered_at)}</time><p>已找到 {vehicle.make} {vehicle.model}，已交给图片队列，等待处理。</p></article>)}
          {!runs.length && !recent.length && !(checkpoint && inLastDay(checkpoint.savedAt,now)) && <p>{data.runs === null || data.recent === null ? '找车记录暂时读不到，请稍后刷新。' : '最近 24 小时没有可显示的找车记录。'}</p>}
          <small>最多显示最近 20 次找车结果和 12 辆新车；Mac 未上传的本地动作暂时看不到。</small>
        </section>
        <section><h3>图片记录</h3>
          {active.map(item => <article className="ajm-log-item" key={item.id}><time>{time(data.settings?.worker_seen_at)}</time><p><b>{item.vehicle}</b> · {photoSteps[steps.find(step=>step.id===item.id)?.stage ?? ''] ?? '图片已领取，等待下一步消息'}</p><small>{photoRecent && !outdated && !error ? '这是最近收到的处理步骤。' : '这是上次收到的步骤，当前状态待确认。'}</small></article>)}
          {records.map(item => <article className="ajm-log-item" key={item.id}><time>{time(item.updated_at)}</time><p><b>{item.vehicle}</b> · {item.status==='approved'?'这张图片已处理好，可以使用。':(item.failure_count ?? 0)>=3?'这张图片已失败 3 次，不再重试；其他合格图片可继续上架。':'这张图片处理失败，请查看下面的原因。'}</p>{item.error && problem(item.error)}</article>)}
          {errors.map(item => <article className="ajm-log-item" key={`error-${item.id}`}><time>{time(item.created_at)}</time><p><b>{item.vehicle}</b> · {photoSteps[item.stage] ?? '处理图片'}时遇到问题。</p>{problem(item.message)}<small>这是当时的出错记录，不代表现在仍有故障；是否已经恢复请看上方最新进度。</small></article>)}
          {!active.length && !records.length && !errors.length && <p>{data.activePhotos === null || data.photoRecords === null || data.photoErrors === null ? '图片记录暂时读不到，请稍后刷新。' : '最近 24 小时没有可显示的图片记录。'}</p>}
          <small>显示当前任务，以及最近 20 条处理结果和 20 条出错记录。</small>
        </section>
      </div></section>
    </>}
  </section>;
}
