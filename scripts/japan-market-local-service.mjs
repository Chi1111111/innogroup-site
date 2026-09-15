import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function createLocalService({ token = randomBytes(24).toString('hex'), launch = () => spawn(process.execPath,
  [fileURLToPath(new URL('./sync-japancars-japan-market.mjs', import.meta.url)), '--remote', '--target=5000'],
  { env: { ...process.env, JAPANCARS_REQUEST_GAP_MS: '3000', JAPANCARS_CONCURRENCY: '1', JAPANCARS_TIMEOUT_MS: '21600000' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }) } = {}) {
  let child;
  let state = { status: 'idle', startedAt: null, finishedAt: null, message: '本地程序已连接，可以开始扫描。' };
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
    if (req.method !== 'POST' || req.url !== '/scan') return reply(404, { message: '接口不存在' });
    if (child) return reply(409, { message: '这台电脑已有扫描正在运行。' });
    state = { status: 'running', startedAt: new Date().toISOString(), finishedAt: null, message: '扫描中：最多 5,000 辆，间隔 3 秒。详细进度见本地程序窗口。' };
    try {
      child = launch();
      child.stdout?.on('data', chunk => process.stdout.write(chunk));
      child.stderr?.on('data', chunk => process.stderr.write(chunk));
      const finish = (ok) => {
        child = undefined;
        state = { ...state, status: ok ? 'finished' : 'failed', finishedAt: new Date().toISOString(), message: ok ? '采集已结束。请待云端发布完成后刷新运行记录，查看实际采集数量与变更。' : '扫描或上传失败，请查看本地窗口。已有云端库存保留。' };
      };
      child.once('error', () => finish(false));
      child.once('close', code => finish(code === 0));
      reply(202, state);
    } catch { child = undefined; state = { ...state, status: 'failed', message: '无法启动本地扫描。' }; reply(500, state); }
  });
  return { server, token };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server, token } = createLocalService();
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '本地程序已经启动，或端口 17831 被占用。' : error.message); process.exitCode = 1; });
  server.listen(17831, '127.0.0.1', () => console.log(`本地采集服务已启动。保持此窗口开启。\nAdmin → 本地运行 → 输入配对码：\n${token}\n最多 5000 辆 / 间隔 3 秒 / 结果仅上传云端`));
}
