import { useEffect, useState } from 'react';

type Progress = { status: string; message: string; startedAt?: string; finishedAt?: string; metrics?: Record<string, number | string | boolean | null>; logs?: { at: string; level: string; text: string }[] };
const stages: Record<string, string> = { cooldown: '详情暂不可用，自动等待恢复', configuration: '连接云端库存', listing: '读取车辆列表', details: '读取车辆详情', validation: '核对并合并库存', publish: '上传云端', complete: '已上传，等待网站发布', access: '来源访问受限' };
async function localRequest(token: string, endpoint: string, method = 'GET'): Promise<Progress> {
  const response = await fetch(`http://127.0.0.1:17831/${endpoint}`, { method, headers: { Authorization: `Bearer ${token.trim()}` }, signal: AbortSignal.timeout(10000), cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || '本地程序请求失败');
  return data;
}
export function LocalJapanMarketRunner() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const running = progress?.status === 'running';
  const connect = async (start: boolean) => {
    setBusy(true); setError('');
    try {
      const current = await localRequest(token, 'status');
      setProgress(start && current.status !== 'running' ? await localRequest(token, 'scan', 'POST') : current);
      setNow(Date.now());
    } catch (e) { setError(e instanceof TypeError || (e instanceof Error && e.name === 'TimeoutError') ? '无法连接本地程序。请先启动服务，允许浏览器访问本地网络，再重试。' : e instanceof Error ? e.message : '连接失败'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!running) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const data = await localRequest(token, 'status');
        if (active) { setProgress(data); setNow(Date.now()); setError(''); }
      } catch { if (active) setError('实时连接中断，正在重连。以下为最后收到的进度，不代表扫描已停止。'); }
      if (active) timer = setTimeout(() => void poll(), 2000);
    };
    timer = setTimeout(() => void poll(), 2000);
    return () => { active = false; clearTimeout(timer); };
  }, [running, token]);
  const m = progress?.metrics;
  const n = (key: string) => typeof m?.[key] === 'number' ? m[key] as number : 0;
  const count = (key: string) => n(key).toLocaleString('en-NZ');
  const seconds = progress?.startedAt ? Math.max(0, Math.floor(((progress.finishedAt ? Date.parse(progress.finishedAt) : now) - Date.parse(progress.startedAt)) / 1000)) : 0;
  const stats = [['发现车源', 'received'], ['已读取详情', 'detailSucceeded'], ['有效车源', 'accepted'], ['FOB 报价', 'withFobPrice'], ['照片链接', 'photoCount'], ['跳过已有车源', 'detailSkipped'], ['过滤车源', 'rejected'], ['详情失败', 'detailFailed'], ['读取列表页', 'pagesFetched'], ['来源请求', 'requests']];
  return <div>
    <button type="button" className="ajm-button" aria-expanded={open} onClick={() => setOpen(!open)}>本地运行</button>
    {open && <section className="ajm-panel ajm-local-panel">
      <strong>用这台电脑扫描 · 最多 5,000 辆 · 间隔 3 秒</strong>
      <p><a href="/downloads/japan-market-local.zip" download>下载最新版本地程序</a>，解压后按 README 启动服务。更新程序请等当前批次结束后重启。</p>
      <label>配对码 <input aria-label="本地程序配对码" type="password" autoComplete="off" value={token} disabled={running} onChange={e => { setToken(e.target.value); setProgress(null); }} /></label>
      <div className="ajm-actions">
        <button type="button" className="ajm-button" disabled={busy || !token.trim()} onClick={() => void connect(false)}>连接并查看进度</button>
        <button type="button" className="ajm-button primary" disabled={busy || running || !token.trim()} onClick={() => void connect(true)}>{busy ? '连接中…' : running ? '本地扫描中…' : '开始本地扫描'}</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {progress && <div className="ajm-local-progress">
        <p role="status">{progress.message}</p>
        {m ? <>
          <strong>{progress.status === 'failed' ? '运行失败' : stages[String(m.stage)] ?? '等待采集进度'}</strong>
          <p>已用时 {Math.floor(seconds / 60)} 分 {seconds % 60} 秒 · 每 2 秒刷新</p>
          {m.stage === 'cooldown' && m.resumeAt && <p role="status">正在等待，约 {Math.max(0, Math.ceil((Date.parse(String(m.resumeAt)) - now) / 60000))} 分钟后自动检查恢复（第 {count('recoveryAttempts')} / 3 次）。保持程序开启，已采集结果暂存在内存中。</p>}
          <label>本批有效车源：{count('accepted')} / 上限 {(n('target') || 5000).toLocaleString('en-NZ')}
            <progress aria-label="本批有效车源进度" value={n('accepted')} max={n('target') || 5000} />
          </label>
          <small>这是采集数量，不是整体完成百分比；访问受限或无更多车源时可能提前结束。</small>
          <dl className="ajm-local-stats">{stats.map(([label, key]) => <div key={key}><dt>{label}</dt><dd>{count(key)}</dd></div>)}</dl>
          {!!m.sourceAccessBlocked && <p role="alert">来源访问受限，采集已停止；请查看上传状态，确认已采集车辆是否保存到云端。</p>}
          <p>上传状态：{m.published ? `已上传（新增 ${count('added')} 辆，更新 ${count('updated')} 辆），待网站发布后刷新运行记录。` : m.stage === 'publish' && running ? '正在上传，请保持本地程序开启。' : '尚未上传本批车源'}</p>
          {m.lastProgressAt && <small>程序最后报告：{new Date(String(m.lastProgressAt)).toLocaleTimeString()}</small>}
        </> : progress.status !== 'idle' && <p>此程序未提供实时统计，请在本批结束后下载最新版并重启。</p>}
        {!!progress.logs?.length && <details open><summary>最近运行日志（最多 50 条）</summary><div className="ajm-local-logs">{progress.logs.map((log, i) => <p key={`${log.at}-${i}`}><time>{new Date(log.at).toLocaleTimeString()}</time> {log.level === 'error' ? '⚠ ' : ''}{log.text}</p>)}</div></details>}
      </div>}
      <p>刷新网页后重新填入配对码，点击“连接并查看进度”可接回当前任务。进度和日志仅保留在本地程序内存，不写入文件。</p>
    </section>}
  </div>;
}
