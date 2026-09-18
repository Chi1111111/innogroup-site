// Isolated local browser verification: every remote request is mocked or blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Local server required');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let readFails = false;
let saveFails = false;
let writes = 0;
let concurrent = 0;
let maxConcurrent = 0;
let cloud = { leads: [], orders: [], loanCars: [] };
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/functions/v1/admin-api')) {
    const { action, payload } = route.request().postDataJSON();
    if (action === 'session.verify') return route.fulfill({ json: { data: { valid: true } } });
    if (action === 'crm.get') return readFails ? route.fulfill({ status: 503, json: { error: '模拟读取失败' } }) : route.fulfill({ json: { data: cloud } });
    if (action === 'crm.upsert') {
      writes++; concurrent++; maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((resolve) => setTimeout(resolve, 80));
      concurrent--;
      if (saveFails) return route.fulfill({ status: 503, json: { error: '模拟保存失败' } });
      cloud = payload;
      return route.fulfill({ json: { data: null } });
    }
    return route.fulfill({ json: { data: [] } });
  }
  if (url.origin !== origin) return route.abort();
  return route.continue();
});
fs.mkdirSync('tmp/admin-review', { recursive: true });
try {
  await page.goto(`${origin}/admin`);
  await page.getByRole('heading', { name: '登录管理中心' }).waitFor();
  await page.evaluate(() => sessionStorage.setItem('inno:admin-session:v1', 'isolated-test-session'));
  await page.reload();
  await page.getByRole('heading', { name: '今天，从这里开始。' }).waitFor();
  await page.screenshot({ path: 'tmp/admin-review/dashboard-desktop.png', fullPage: true });
  assert.equal(await page.getByRole('navigation', { name: '后台主导航' }).count(), 1);
  for (const [path, heading] of [['crm', 'CRM 客户管理'], ['contracts', '合同管理后台'], ['invoices', '发票管理'], ['weekly-reports', '周报管理'], ['partners', '合作伙伴'], ['japan-market', 'Japan Market 采集中心']]) {
    await page.goto(`${origin}/admin/${path}`);
    await page.getByRole('heading', { name: heading, exact: true }).waitFor();
    assert.equal(await page.getByRole('navigation', { name: '后台主导航' }).count(), 1);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path} desktop overflow`);
  }
  await page.goto(`${origin}/admin/crm?view=orders`);
  assert.equal(await page.getByRole('heading', { name: '新增线索', exact: true }).count(), 0);
  readFails = true;
  const writesBeforeFailure = writes;
  await page.reload();
  await page.getByRole('alert').filter({ hasText: '读取失败' }).waitFor();
  assert.equal(await page.locator('fieldset').evaluate((el) => el.disabled), true);
  assert.equal(writes, writesBeforeFailure);
  readFails = false;
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('fieldset')?.disabled);
  await page.goto(`${origin}/admin/crm`);
  await page.waitForFunction(() => !document.querySelector('fieldset')?.disabled);
  const form = page.locator('form').first();
  saveFails = true;
  // The new lead form uses visible labels; choose its customer name field.
  await form.getByLabel('客户姓名', { exact: true }).fill('测试客户');
  await form.getByRole('button', { name: /添加|保存|新增/ }).click();
  await page.getByRole('alert').filter({ hasText: '保存失败' }).waitFor();
  saveFails = false;
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '云端已保存' }).waitFor();
  assert.equal(cloud.leads[0].name, '测试客户');
  assert.equal(maxConcurrent, 1);
  await page.screenshot({ path: 'tmp/admin-review/crm-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['crm', 'contracts', 'invoices', 'weekly-reports', 'partners', 'japan-market']) {
    await page.goto(`${origin}/admin/${route}`);
    await page.locator('#admin-content h1').first().waitFor();
    await page.screenshot({ path: `tmp/admin-review/${route}-mobile.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} mobile overflow`);
  }
  await page.goto(`${origin}/admin`);
  await page.getByRole('heading', { name: '今天，从这里开始。' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'tmp/admin-review/dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '展开导航' }).click();
  await page.getByRole('navigation', { name: '后台主导航' }).getByRole('link', { name: '发票管理', exact: true }).click();
  await page.getByRole('heading', { name: '发票管理', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '展开导航' }).getAttribute('aria-expanded'), 'false');
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.admin-sidebar').isVisible(), false);
  assert.equal(await page.locator('.admin-topbar').isVisible(), false);
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('heading', { name: '登录管理中心' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS all admin routes, auth gate/logout, navigation, print layout, mobile menu, CRM read protection and save retry.');
} finally { await browser.close(); }
