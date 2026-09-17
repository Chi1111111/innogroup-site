import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function createLocalService({ maxDurationMs = 21600000, token = randomBytes(24).toString('hex'), schedule = setTimeout, cancel = clearTimeout, now = Date.now, launch = ({ target, timeoutMs, rotationCursor }) => spawn(process.execPath,
  [fileURLToPath(new URL('./sync-japancars-japan-market.mjs', import.meta.url)), '--remote', `--target=${target}`],
  { env: { ...process.env, JAPANCARS_AUTO_BATCH: '1', JAPANCARS_ROTATION_CURSOR: JSON.stringify(rotationCursor || {}), JAPANCARS_REQUEST_GAP_MS: '3000', JAPANCARS_CONCURRENCY: '1', JAPANCARS_TIMEOUT_MS: String(timeoutMs) }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true }) } = {}) {
  let child;
  let nextBatch;
  let totalAdded = 0;
  let batchNumber = 0;
  let stopAfterBatch = false;
  let deadline = 0;
  let rotationCursor = {};
  let state = { status: 'idle', startedAt: null, finishedAt: null, message: '本地程序已连接，可以开始扫描。' };
  const decorate = metrics => ({ ...metrics, totalAdded, batchNumber, cumulativeTarget: 5000, stopAfterBatch });
  const log = (chunk, level = 'info') => {
    const text = String(chunk).replace(/\x1b\[[0-9;]*m/g, '').slice(0, 2000).trim();
    if (text) state = { ...state, logs: [...(state.logs || []), { at: new Date(now()).toISOString(), level, text }].slice(-50) };
  };
  const finish = (ok, message) => {
    state = { ...state, status: ok ? 'finished' : 'failed', finishedAt: new Date(now()).toISOString(), message, metrics: decorate(state.metrics) };
  };
  const startBatch = () => {
    nextBatch = undefined;
    const remaining = 5000 - totalAdded;
    const timeoutMs = Math.floor(deadline - now());
    if (stopAfterBatch || remaining <= 0 || timeoutMs < 60000 || batchNumber >= 40) return finish(true, `自动批次已结束，累计上传新增 ${totalAdded} 辆。`);
    batchNumber++;
    state = { ...state, message: `第 ${batchNumber} 批采集中；上传成功后自动继续，累计上限 5,000 辆。`, metrics: decorate({ stage: 'configuration', target: remaining }) };
    let current;
    try { current = launch({ target: remaining, timeoutMs, rotationCursor }); child = current; }
    catch { return finish(false, '无法启动采集。已上传库存保留，未自动重启。'); }
    let launchFailed = false;
    current.on('message', data => {
      if (child === current && data?.type === 'progress' && data.metrics && typeof data.metrics === 'object') state = { ...state, metrics: decorate(data.metrics) };
    });
    current.stdout?.on('data', chunk => { process.stdout.write(chunk); log(chunk); });
    current.stderr?.on('data', chunk => { process.stderr.write(chunk); log(chunk, 'error'); });
    current.once('error', () => { launchFailed = true; });
    current.once('close', code => {
      if (child !== current) return;
      child = undefined;
      const m = state.metrics || {};
      const uploaded = m.published === true && Number.isInteger(m.added) && m.added >= 0;
      if (uploaded) { totalAdded += m.added; rotationCursor = m.rotationCursor || rotationCursor; }
      const ok = !launchFailed && code === 0 && uploaded;
      const continueBatch = ok && uploaded && m.added > 0 && m.stopCode === 'BATCH_CONTENT_MISSING'
        && !m.sourceAccessBlocked && !stopAfterBatch && totalAdded < 5000 && batchNumber < 40 && deadline - now() >= 90000;
      state = { ...state, metrics: decorate(m) };
      if (!continueBatch) return finish(ok, ok ? `采集结束，累计上传新增 ${totalAdded} 辆。${m.sourceAccessBlocked ? '来源访问受限，已停止自动批次。' : '请刷新云端运行记录。'}` : '扫描或上传失败，已停止自动批次。已有云端库存保留，请查看日志。');
      const resumeAt = new Date(now() + 30000).toISOString();
      state = { ...state, message: `本批已上传，累计新增 ${totalAdded} 辆；30 秒后自动启动下一批。`, metrics: decorate({ ...m, stage: 'between_batches', resumeAt }) };
      log(`Batch ${batchNumber} uploaded. ${totalAdded}/5000 new vehicles saved; next batch in 30 seconds.`);
      nextBatch = schedule(startBatch, 30000);
    });
  };
  const origins = new Set(['https://www.innogroup.co.nz', 'https://innogroup.co.nz']);
  const server = createServer((req, res) => {
    const reply = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    if (req.headers.host !== `127.0.0.1:${server.address().port}` || !origins.has(req.headers.origin)) return reply(403, { message: '来源不允许' });
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.writeHead(204); return res.end();
    }
    const supplied = Buffer.from(String(req.headers.authorization || ''));
    const expected = Buffer.from(`Bearer ${token}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply(401, { message: '配对码错误，请复制本地程序窗口中的配对码。' });
    if (req.method === 'GET' && req.url === '/status') return reply(200, state);
    if (req.method === 'POST' && req.url === '/stop-after-batch') {
      stopAfterBatch = true;
      if (nextBatch) { cancel(nextBatch); nextBatch = undefined; finish(true, `自动继续已停止，累计上传新增 ${totalAdded} 辆。`); }
      else state = { ...state, message: child ? '将在当前批次结束并尝试上传后停止，不再启动下一批。' : state.message, metrics: decorate(state.metrics) };
      return reply(200, state);
    }
    if (req.method !== 'POST' || req.url !== '/scan') return reply(404, { message: '接口不存在' });
    if (state.status === 'running') return reply(409, { message: '这台电脑已有扫描或批次等待正在运行。' });
    state = { status: 'running', startedAt: new Date().toISOString(), finishedAt: null, message: '扫描中：最多 5,000 辆，间隔 3 秒。', metrics: { stage: 'configuration', target: 5000 }, logs: [] };
    rotationCursor = {}; totalAdded = 0; batchNumber = 0; stopAfterBatch = false; deadline = now() + maxDurationMs;
    startBatch();
    reply(state.status === 'failed' ? 500 : 202, state);

  });
  server.on('close', () => { if (nextBatch) cancel(nextBatch); stopAfterBatch = true; });
  return { server, token };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server, token } = createLocalService();
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '本地程序已经启动，或端口 17831 被占用。' : error.message); process.exitCode = 1; });
  server.listen(17831, '127.0.0.1', () => console.log(`本地采集服务已启动。保持此窗口开启。\nAdmin → 本地运行 → 输入配对码：\n${token}\n最多 5000 辆 / 间隔 3 秒 / 结果仅上传云端`));
}
