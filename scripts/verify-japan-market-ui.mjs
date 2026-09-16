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
const showingLabel = `Showing 1–${Math.min(24, validCount)} of ${validCount.toLocaleString('en-NZ')}`;
const badMake = '不是我 /*不足完全无限想象好用运用父母完成成功劳动自我无限人类数学力学不断存在';
const polluted = { ...snapshot.vehicles[0], id: 'invalid-car', make: badMake };
let historyMode = 'records';
let localPolls=0;
let localStarted=false;
const runs = ['success', 'partial', 'failed', 'cancelled'].map((status, index) => ({
  id: `test-${index}`, source: 'CARAPIS · Carsensor', trigger: 'schedule',
  startedAt: '2026-09-06T17:01:47Z', finishedAt: '2026-09-06T17:02:15Z', durationSeconds: 28,
  status, error: status === 'failed' ? '测试：车源为空，保留上次车源。' : null,
  workflowUrl: null,
  metrics: status === 'cancelled' ? {} : { received: 4008, accepted: 3991, rejected: 17, pagesExpected: 41, pagesFetched: 41, requests: 100, detailRequested: 59, detailSucceeded: status === 'partial' ? 58 : 59, detailFailed: status === 'partial' ? 1 : 0, added: 20, removed: 5, published: status === 'success' || status === 'partial', rejectionReasons: { invalid_make: 13, invalid_year: 4 } },
}));
runs[0].metrics.changesPath='changes/test-0.json';
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/functions/v1/japan-market-scan')) return route.fulfill({ json: { data: { started: true, message: '扫描任务已提交。', workflowUrl: 'https://github.com/Chi1111111/innogroup-site/actions/workflows/japan-market-daily-sync.yml' } } });
  if (url.pathname.endsWith('/functions/v1/admin-api')) return route.fulfill({ json: { data: { valid: true } } });
  if (url.pathname === '/data/japan-market/changes/test-0.json') return route.fulfill({json:{changes:[{id:'test-car',name:'Toyota Test',stockNumber:'TEST',kind:'updated',changes:[{field:'fobPriceNzd',before:100,after:200}],addedPhotos:[],removedPhotos:[]}]}});
  if (url.origin === 'http://127.0.0.1:17831') {
    if(url.pathname==='/scan')localStarted=true;
    const finished=localStarted && url.pathname==='/status' && ++localPolls>=2;
    return route.fulfill({json:{status:!localStarted?'idle':finished?'finished':'running',message:finished?'本地测试任务已完成':'本地测试扫描中',startedAt:new Date(Date.now()-10000).toISOString(),metrics:{stage:finished?'complete':localPolls===0?'cooldown':'details',resumeAt:new Date(Date.now()+900000).toISOString(),recoveryAttempts:1,batchNumber:2,totalAdded:144,rotationMake:'Toyota',rotationModel:'Tank',rotationCycle:2,accepted:finished?25:12,target:5000,photoCount:155,withFobPrice:10,published:finished},logs:[{at:new Date().toISOString(),level:'info',text:'测试实时日志'}]},headers:{'Access-Control-Allow-Origin':origin}});
  }
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

  for(const id of ['578d08c4-4834-4410-90b7-062dcbfde665','420e1cde-498e-4447-ac87-db28cf430a50']) {
    await page.goto(`${origin}/japan-market/${id}`);
    await page.getByText('FOB price on request',{exact:true}).first().waitFor();
    assert.equal(/\$(200,600|593,300|239,000|690,600)/.test(await page.locator('body').innerText()),false);
  }
  console.log('PASS abnormal legacy prices withheld on both vehicle detail pages');
  await page.goto(`${origin}/admin/japan-market`);
  await page.getByRole('heading', { name: '统一密码登录' }).waitFor();
  await page.evaluate(() => sessionStorage.setItem('inno:admin-session:v1', 'local-test-only'));
  await page.reload();
  await page.getByRole('heading', { name: 'Japan Market 采集中心' }).waitFor();
  await page.getByRole('button', { name: '本地运行', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '开始本地扫描', exact: true }).isDisabled(), true);
  await page.getByLabel('本地程序配对码').fill('test-pairing');
  await page.getByRole('button', { name: '开始本地扫描', exact: true }).click();
  await page.getByText('测试实时日志', {exact:false}).waitFor();
  await page.getByText('详情暂不可用，自动等待恢复', {exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('value'),'12');
  await page.getByRole('button',{name:'本批结束后停止',exact:true}).waitFor();
  await page.getByText('第 2 批 · 累计已上传新增 144 / 5,000 辆',{exact:true}).waitFor();
  await page.getByText('第 2 轮 · Toyota / Tank · 本组合最多新增 5 辆',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:1440,height:1000});
  await page.getByText('本地测试任务已完成', {exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('value'),'25');
  await page.getByRole('button', { name: '本地运行', exact: true }).click();
  await page.getByRole('button', { name: '手动扫描', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '扫描任务已提交。' }).waitFor();
  await page.getByRole('button', { name: /车源与报价/ }).click();
  assert.equal(await page.getByLabel('车源排序').inputValue(), 'newest');
  const expected=snapshot.vehicles.filter(v=>!vehicleQualityIssue(v)).sort((a,b)=>Date.parse(b.priceCheckedAt || b.updatedAt)-Date.parse(a.priceCheckedAt || a.updatedAt))[0];
  assert.ok((await page.locator('tbody tr').first().innerText()).includes(expected.stockNumber || expected.id));
  await page.getByLabel('车源排序').selectOption('oldest');
  await page.getByRole('button', { name: '运行记录', exact: true }).click();
  await page.locator('details').first().waitFor();
  assert.equal(await page.locator('details').count(), 4);
  await page.locator('summary').first().click();
  await page.getByRole('button',{name:'查看更新详情'}).first().click();
  await page.getByText('FOB 价格（NZD）：100 → 200').waitFor();
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
