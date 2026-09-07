import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory = path.resolve('public/data/japan-market');
const historyPath = path.join(directory, 'sync-history.json');
const id = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || '1'}`
  : randomUUID();
const previous = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf8')) : { runs: [] };
const finalizeOnly = process.argv.includes('--finalize');
if (finalizeOnly && previous.runs.some((run) => run.id === id)) process.exit(0);

const startedAt = new Date().toISOString();
let metrics = {};
let status = process.env.SYNC_OUTCOME === 'cancelled' ? 'cancelled' : 'failed';
if (!finalizeOnly) {
  const temporary = fs.mkdtempSync(path.resolve('tmp-sync-'));
  const metricsFile = path.join(temporary, 'metrics.json');
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./sync-carapis-japan-market.mjs', import.meta.url)), ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: { ...process.env, JAPAN_MARKET_METRICS_FILE: metricsFile },
    });
    if (fs.existsSync(metricsFile)) metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    status = result.status === 0 && metrics.published
      ? metrics.detailFailed > 0 ? 'partial' : 'success'
      : 'failed';
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
const finishedAt = new Date().toISOString();
const errors = {
  configuration: '采集配置不完整，请查看任务日志。',
  listing: '列表请求或分页校验失败，保留上次车源。',
  details: '详情请求失败，请查看任务日志。',
  validation: '车源为空或异常比例超过 20%，保留上次车源。',
  publish: '文件输出未完成，请查看任务日志。',
};
const run = {
  id, source: 'CARAPIS · Carsensor',
  trigger: process.env.GITHUB_EVENT_NAME || 'local',
  startedAt: finalizeOnly ? null : startedAt, finishedAt,
  durationSeconds: finalizeOnly ? null : Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000),
  status, metrics,
  error: status === 'failed' ? errors[metrics.stage] || '任务未完成，请查看执行日志。'
    : status === 'cancelled' ? '任务被取消，未确认采集完成。' : null,
  workflowUrl: process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
};
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(historyPath, JSON.stringify({ version: 1, runs: [run, ...previous.runs].slice(0, 90) }, null, 2) + '\n');
if (!finalizeOnly && status === 'failed') process.exitCode = 1;
