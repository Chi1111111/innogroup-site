// Run against a local Vite server; all API authentication and report data are mocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { vehicleQualityIssue } from '../src/data/japanMarketQuality.mjs';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:4179';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Local test server required.');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const snapshot = JSON.parse(fs.readFileSync('public/data/japan-market/index.json', 'utf8'));
const validCount = snapshot.vehicles.filter((vehicle) => !vehicleQualityIssue(vehicle)).length;
const showingLabel = `Showing ${Math.min(24, validCount).toLocaleString('en-NZ')} of ${validCount.toLocaleString('en-NZ')}`;
const badMake = '不是我 /*不足完全无限想象好用运用父母完成成功劳动自我无限人类数学力学不断存在';
const polluted = { ...snapshot.vehicles[0], id: 'invalid-car', make: badMake };
let historyMode = 'records';
const runs = ['success', 'partial', 'failed', 'cancelled'].map((status, index) => ({
  id: `test-${index}`, source: 'CARAPIS · Carsensor', trigger: 'schedule',
  startedAt: '2026-09-06T17:01:47Z', finishedAt: '2026-09-06T17:02:15Z', durationSeconds: 28,
  status, error: status === 'failed' ? '测试：车源为空，保留上次车源。' : null,
  workflowUrl: null,
  metrics: status === 'cancelled' ? {} : { received: 4008, accepted: 3991, rejected: 17, pagesExpected: 41, pagesFetched: 41, requests: 100, detailRequested: 59, detailSucceeded: status === 'partial' ? 58 : 59, detailFailed: status === 'partial' ? 1 : 0, added: 20, removed: 5, published: status === 'success' || status === 'partial', rejectionReasons: { invalid_make: 13, invalid_year: 4 } },
}));
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/functions/v1/admin-api')) return route.fulfill({ json: { data: { valid: true } } });
  if (url.origin !== origin) return route.abort();
  if (url.pathname === '/data/japan-market/index.json') return route.fulfill({ json: { ...snapshot, count: snapshot.count + 1, vehicles: [...snapshot.vehicles, polluted] } });
  if (url.pathname === '/data/japan-market/sync-history.json') {
    if (historyMode === 'missing') return route.fulfill({ status: 404, body: '' });
    if (historyMode === 'error') return route.fulfill({ status: 500, body: '' });
    return route.fulfill({ json: { version: 1, runs } });
  }
  return route.continue();
});
try {
  await page.goto(`${origin}/japan-market?make=${encodeURIComponent(badMake)}`);
  await page.waitForFunction(() => !new URL(location.href).searchParams.has('make'));
  await page.getByText(showingLabel, { exact: false }).waitFor();
  assert.equal((await page.locator('body').innerText()).includes(badMake), false);
  fs.mkdirSync('tmp', { recursive: true });
  await page.screenshot({ path: 'tmp/japan-market-clean.png', fullPage: true });
  await page.getByRole('link', { name: 'Home', exact: true }).first().click();
  await page.getByRole('link', { name: 'Japan Market', exact: true }).first().click();
  await page.getByText(showingLabel, { exact: false }).waitFor();
  console.log('PASS polluted URL recovery, hidden corrupt card, and navigation');

  await page.goto(`${origin}/admin/japan-market`);
  await page.getByRole('heading', { name: '统一密码登录' }).waitFor();
  await page.evaluate(() => sessionStorage.setItem('inno:admin-session:v1', 'local-test-only'));
  await page.reload();
  await page.getByRole('heading', { name: '每日 Japan Market 采集' }).waitFor();
  await page.locator('details').first().waitFor();
  assert.equal(await page.locator('details').count(), 4);
  await page.locator('summary').first().click();
  await page.screenshot({ path: 'tmp/admin-japan-market.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'tmp/admin-japan-market-mobile.png', fullPage: true });
  historyMode = 'missing';
  await page.getByRole('button', { name: '刷新记录' }).click();
  await page.getByText('尚无采集详情。', { exact: false }).waitFor();
  historyMode = 'error';
  await page.getByRole('button', { name: '刷新记录' }).click();
  await page.getByRole('alert').filter({ hasText: '无法读取采集历史' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS Admin login gate, 4 report statuses, mobile layout, missing history, failed fetch; no JS exceptions');
} finally {
  await browser.close();
}
