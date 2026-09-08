import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { loadCollectionReport, type CollectionReport, type CollectionRun } from '../../data/japanMarketSync';

const statuses = {
  success: { label: '成功', style: 'bg-emerald-50 text-emerald-800' },
  partial: { label: '部分成功（详情未完全更新）', style: 'bg-amber-50 text-amber-800' },
  failed: { label: '失败', style: 'bg-red-50 text-red-800' },
  cancelled: { label: '已取消', style: 'bg-slate-100 text-slate-700' },
};
const reasonLabels: Record<string, string> = {
  invalid_record: '记录格式异常', missing_id: '缺少 ID', invalid_make: '品牌异常',
  invalid_model: '车型异常', invalid_year: '年份异常', invalid_mileage: '里程异常',
};
function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Pacific/Auckland', dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date(value))
    : '未记录';
}
function number(value: number | null | undefined) {
  return value == null ? '未记录' : value.toLocaleString('en-NZ');
}
function RunDetails({ run }: { run: CollectionRun }) {
  const status = statuses[run.status] ?? statuses.failed;
  const m = run.metrics;
  const counts = [
    ['收到记录', m.received], ['有效车源', m.accepted], ['剔除异常', m.rejected],
    ['新增车源', m.added], ['不再出现', m.removed], ['API 请求（含重试）', m.requests],
    ['详情请求', m.detailRequested], ['详情成功', m.detailSucceeded], ['详情失败', m.detailFailed],
    ['超时跳过详情', m.detailSkipped],
  ] as const;
  return <details className="rounded-2xl border border-slate-200 bg-white p-5" open={run.status !== 'success'}>
    <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
      <span className={`rounded-full px-3 py-1 font-semibold ${status.style}`}>{status.label}</span>
      <span className="font-semibold">{date(run.startedAt ?? run.finishedAt)}</span>
      <span className="text-slate-500">有效 {number(m.accepted)} · 剔除 {number(m.rejected)}</span>
      <span className="ml-auto text-slate-500">展开详情</span>
    </summary>
    {run.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{run.error}</p>}
    {m.timedOut && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">采集达到内部时间上限；列表阶段超时会保留旧快照，详情阶段超时会发布列表并沿用已有照片。</p>}
    <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {counts.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-lg font-semibold">{number(value)}</dd></div>)}
    </dl>
    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
      <p>来源：{run.source} · 触发：{run.trigger === 'schedule' ? '每日定时' : run.trigger === 'workflow_dispatch' ? '手动执行' : run.trigger}</p>
      <p>分页：{number(m.pagesFetched)} / {number(m.pagesExpected)} · 耗时：{number(run.durationSeconds)} 秒</p>
      {m.lastProgressAt && <p>最后进度：{date(m.lastProgressAt)}{m.activeRequests?.length ? ` · 当时正在请求：${m.activeRequests.join('、')}` : ''}</p>}
      <p>结束时间：{date(run.finishedAt)} · 车源文件：{m.published ? '已生成' : '未确认生成'}</p>
      {Object.entries(m.rejectionReasons ?? {}).map(([reason, count]) => <p key={reason}>剔除原因：{reasonLabels[reason] ?? reason} × {number(count)}</p>)}
      <p>“新增／不再出现”与上次快照对比，不等于成交数量。详情失败时可能沿用旧照片；请求预算用完的未尝试详情不计为失败。</p>
      {run.workflowUrl?.startsWith('https://github.com/') && <a className="inline-block font-semibold text-blue-700 underline" href={run.workflowUrl} target="_blank" rel="noreferrer">查看 GitHub 执行日志 ↗</a>}
    </div>
  </details>;
}

export function AdminJapanMarket() {
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadCollectionReport().then((value) => { if (active) setReport(value); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '加载失败'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const stale = report && Date.now() - Date.parse(report.refreshedAt) > 36 * 60 * 60 * 1000;
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><Link to="/admin" className="text-sm text-slate-500 hover:underline">← 返回 Admin</Link><h1 className="mt-3 text-3xl font-bold">每日 Japan Market 采集</h1></div>
        <button type="button" onClick={() => setRevision((value) => value + 1)} disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? '加载中…' : '刷新记录'}</button>
      </div>
      <p className="mb-6 text-sm leading-7 text-slate-600">每日计划：新西兰冬令时 02:17／夏令时 03:17（UTC 14:17，GitHub 可能延迟）。以下时间均为新西兰时间。最近保留 90 次记录；记录随网站发布更新，不是实时运行状态。</p>
      {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {report && <>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">当前已部署车源快照</p><p className="mt-2 text-3xl font-bold">{number(report.count)} 台</p><p className="mt-2 text-xs text-slate-500">采集输出数；前端会另外过滤旧快照中的异常记录。</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">当前快照生成时间</p><p className="mt-2 text-xl font-semibold">{date(report.refreshedAt)}</p>{stale && <p className="mt-2 text-sm text-amber-800">超过 36 小时未更新，请检查采集及网站部署。</p>}</div>
        </div>
        <div className="space-y-4">{report.runs.map((run) => <RunDetails key={run.id} run={run} />)}</div>
        {!report.runs.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">尚无采集详情。新版采集任务首次执行并发布后会显示；历史任务不会补造统计。</p>}
      </>}
      <p className="mt-6 text-sm text-slate-500">若最新任务未显示（例如任务被强制取消或部署失败），请查看 <a href="https://github.com/Chi1111111/innogroup-site/actions/workflows/japan-market-daily-sync.yml" target="_blank" rel="noreferrer" className="text-blue-700 underline">采集任务与报告附件</a>。报告仅保存汇总，不含 API 密钥或原始响应。</p>
    </div>
  </main>;
}
