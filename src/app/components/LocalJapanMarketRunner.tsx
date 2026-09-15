import { useEffect, useState } from 'react';

export function LocalJapanMarketRunner() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const request = async (endpoint: string, method = 'GET') => {
    const response = await fetch(`http://127.0.0.1:17831/${endpoint}`, {
      method, headers: { Authorization: `Bearer ${token.trim()}` }, signal: AbortSignal.timeout(15000), cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '本地程序请求失败');
    return data as { status: string; message: string };
  };
  const start = async () => {
    setBusy(true);
    try { const data = await request('scan', 'POST'); setMessage(data.message); setRunning(data.status === 'running'); }
    catch (error) { setMessage(error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError') ? '无法连接本地程序。请先启动服务，允许浏览器访问本地网络，再重试。' : error instanceof Error ? error.message : '连接失败'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!running) return;
    let active = true;
    const timer = setInterval(() => {
      fetch('http://127.0.0.1:17831/status', { headers: { Authorization: `Bearer ${token.trim()}` }, signal: AbortSignal.timeout(8000), cache: 'no-store' })
        .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
        .then(data => { if (active) { setMessage(data.message); setRunning(data.status === 'running'); } })
        .catch(() => { if (active) { setMessage('与本地程序的连接已断开，请检查程序窗口。'); setRunning(false); } });
    }, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [running, token]);
  return <div>
    <button type="button" className="ajm-button" aria-expanded={open} onClick={() => setOpen(!open)}>本地运行</button>
    {open && <section className="ajm-panel" style={{ padding: 16, marginTop: 12, maxWidth: 520 }}>
      <strong>用这台电脑扫描 · 最多 5,000 辆 · 间隔 3 秒</strong>
      <p>首次使用：<a href="/downloads/japan-market-local.zip" download>下载本地程序</a>，解压后按 README 安装并启动服务。将窗口中的配对码填入下方。</p>
      <label>配对码 <input aria-label="本地程序配对码" type="password" autoComplete="off" value={token} disabled={running} onChange={e => setToken(e.target.value)} /></label>
      <button type="button" className="ajm-button primary" disabled={busy || running || !token.trim()} onClick={() => void start()}>{busy ? '连接中…' : running ? '本地扫描中…' : '开始本地扫描'}</button>
      {message && <p role="status">{message}</p>}
      <p>保持电脑和程序开启。车辆与照片链接在内存处理后上传云端，不写入本地车源文件。一次只在一台电脑运行；遇到来源限制会停止。</p>
    </section>}
  </div>;
}
