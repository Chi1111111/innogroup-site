import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createReporter } from './live-reporter.mjs';
const execFileAsync = promisify(execFile);
import { runCloudCollection } from '../japan-market-cloud-runner.mjs';
import { createLocalService } from '../japan-market-local-service.mjs';

export function needsAttention(status) {
  const m = status.metrics || {};
  return status.status !== 'finished' || Boolean(m.sourceAccessBlocked || m.rateLimited || m.publishError || m.photoQueueError)
    || Boolean(m.stopCode && !['RECOVERED_PENDING'].includes(m.stopCode));
}

export async function run() {
  const root = process.env.INNO_JAPAN_ROOT;
  if (!root || process.env.JAPAN_MARKET_PHOTO_MANAGED !== '1') throw new Error('Start through the Mac installer.');
  const reporter = createReporter(root, process.env.JAPAN_MARKET_PHOTO_CONFIG);
  const paused = path.join(root, 'collector-paused.json');
  const state = path.join(root, 'collector-status.json');
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let service;
  let stopping = false;
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
    stopping = true;
    reporter.update('stopped','采集程序已收到停止指令');
    reporter.close();
    service?.shutdown();
    service?.server.close();
    // launchd owns the process group, including the active collector.
    process.exit(0);
  });
  while (!stopping) {
    if (fs.existsSync(paused)) { reporter.update('paused','采集已暂停，等待 Mac 同事检查后恢复；图片程序独立运行'); await sleep(15000); continue; }
    try {
      reporter.update('starting','正在检查云端连接和图片队列');
      const status = JSON.parse((await execFileAsync(process.env.JAPAN_MARKET_PHOTO_PYTHON,
        [fileURLToPath(new URL('../photo-review/cloud_worker.py', import.meta.url)), 'status', '--config', process.env.JAPAN_MARKET_PHOTO_CONFIG],
        { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] })).stdout);
      if (!status.processingEnabled || Number(status.usedBytes) >= Number(status.budgetBytes)) {
        reporter.update('waiting','正在等待图片队列恢复；一分钟后再次检查',new Date(Date.now()+60000).toISOString());
        fs.writeFileSync(state, JSON.stringify({ status: 'waiting_for_photo_queue', at: new Date().toISOString() }));
        await sleep(60000); continue;
      }
      service = createLocalService({ maxDurationMs: 19800000 });
      const result = await runCloudCollection({ service, onStatus: reporter.progress });
      service = undefined;
      const summary = { status: result.status, metrics: result.metrics, message: result.message, at: new Date().toISOString() };
      fs.writeFileSync(state, JSON.stringify(summary, null, 2));
      if (needsAttention(result)) {
        fs.writeFileSync(paused, JSON.stringify(summary, null, 2));
        reporter.update('paused','本轮采集遇到问题，已暂停；请在 Mac 检查采集日志后恢复');
        console.log('Collection paused persistently. Inspect collector-status.json and logs; use setup.py resume-collector after resolving the cause.');
      } else {
        // A complete pass sleeps for an hour. Restarts retain the cloud cursor.
        console.log('Collection pass completed. Next pass in one hour.');
        reporter.update('waiting','本轮采集已完成，等待下一轮',new Date(Date.now()+3600000).toISOString());
        await sleep(3600000);
      }
    } catch {
      reporter.update('paused','启动检查或采集控制失败，已暂停；请在 Mac 检查日志');
      // Do not print subprocess arguments/configuration or retry failed collection blindly.
      fs.writeFileSync(paused, JSON.stringify({ status: 'failed', at: new Date().toISOString(), message: 'Preflight/controller failed; inspect service logs and credentials.' }));
      console.error('Collector paused after preflight/controller failure.');
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
