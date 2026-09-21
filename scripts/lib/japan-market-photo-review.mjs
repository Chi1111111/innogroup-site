import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const worker = fileURLToPath(new URL('../photo-review/cloud_worker.py', import.meta.url));
const configPath = process.env.JAPAN_MARKET_PHOTO_CONFIG || fileURLToPath(new URL('../../../private-config/japan-photo-review.json', import.meta.url));

// Local collector only. Never embed the scoped cloud credential in public data or GitHub jobs.
export async function queuePhotoReview(vehicles, { config = configPath, launch = spawn } = {}) {
  if (process.env.GITHUB_ACTIONS === 'true' || !fs.existsSync(config)) return { enabled: false };
  const settings = JSON.parse(fs.readFileSync(config, 'utf8'));
  if (!settings.enabled) return { enabled: false };
  const python = settings.python || process.env.JAPAN_MARKET_PHOTO_PYTHON || 'python';
  await new Promise((resolve, reject) => {
    const child = launch(python, [worker, 'enqueue', '--config', config], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let error = '';
    child.stderr.on('data', chunk => { error = (error + chunk).slice(-1500); });
    child.stdout.resume();
    child.stdin.on('error', () => {});
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error(`Photo queue failed (${code}): ${error}`)));
    child.stdin.end(JSON.stringify({ vehicles }));
  });
  const log = fs.openSync(path.join(path.dirname(config), 'photo-worker.log'), 'a');
  try {
    const child = launch(python, [worker, 'work', '--config', config, '--limit', '0', '--max-seconds', '0', '--interval', '2', '--daemon'], { detached: true, windowsHide: true, stdio: ['ignore', log, log] });
    child.on('error', error => console.warn(`Photo worker did not start: ${error.message}. Cloud queue retained.`));
    child.unref();
  } finally { fs.closeSync(log); }
  return { enabled: true };
}
