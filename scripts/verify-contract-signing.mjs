import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.CONTRACT_TEST_BASE_URL || 'http://127.0.0.1:5173';
const signingToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const now = new Date().toISOString();
const contractRow = {
  id: 'contract-signing-browser-test',
  contract_type: 'vehicle-purchase',
  status: 'sent',
  client_name: 'Test Customer',
  client_email: 'customer@example.com',
  client_phone: '0210000000',
  client_address: 'Test Address',
  signing_token: signingToken,
  payload: {
    client: { name: 'Test Customer' },
    purchasedVehicle: { year: '2024', make: 'Toyota', model: 'Corolla' },
  },
  sent_at: now,
  viewed_at: null,
  signed_at: null,
  created_at: now,
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const browserErrors = [];
const signingRequests = [];
page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(message.text());
});
page.on('pageerror', (error) => browserErrors.push(error.message));

await page.route('https://www.googletagmanager.com/**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
});
await page.route('https://fonts.googleapis.com/**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
await page.route('**/rest/v1/contracts*', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contractRow) });
});
await page.route('**/functions/v1/contract-signing', async (route) => {
  const body = route.request().postDataJSON();
  signingRequests.push(body);
  if (body.action === 'sign') await new Promise((resolve) => setTimeout(resolve, 300));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: body.action === 'sign' ? { signedAt: now } : { viewed: true },
    }),
  });
});

try {
  await page.goto(`${baseUrl}/sign/${signingToken}`, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), 'Sign Agreement');
  assert.ok((await page.locator('body').innerText()).trim().length > 0, 'Page rendered blank');
  assert.equal(await page.locator('.vite-error-overlay').count(), 0, 'Vite error overlay is visible');

  await page.getByRole('button', { name: 'Sign document' }).first().click();
  await page.getByRole('heading', { name: 'Finish signing' }).waitFor();

  const checkboxes = page.locator('input[type="checkbox"]');
  assert.equal(await checkboxes.count(), 6);
  for (let index = 0; index < 6; index += 1) await checkboxes.nth(index).check();

  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  assert.ok(bounds, 'Signature canvas was not visible');
  await page.mouse.move(bounds.x + 40, bounds.y + 70);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 140, bounds.y + 100, { steps: 8 });
  await page.mouse.move(bounds.x + 240, bounds.y + 55, { steps: 8 });
  await page.mouse.up();

  const finishButton = page.getByRole('button', { name: 'Finish signing' });
  assert.equal(await finishButton.isEnabled(), true);
  await finishButton.click();
  await page.getByRole('heading', { name: 'Signing completed' }).waitFor();

  const signRequest = signingRequests.find((request) => request.action === 'sign');
  assert.ok(signRequest, 'Signing API was not called');
  assert.equal(signRequest.signingToken, signingToken);
  assert.equal(signRequest.signerName, 'Test Customer');
  assert.match(signRequest.signatureData, /^data:image\/png;base64,/);
  assert.deepEqual(browserErrors, []);

  const screenshotPath = path.join(os.tmpdir(), 'inno-contract-signing-verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.innerText.trim().length > 0);
  assert.ok((await page.locator('body').innerText()).trim().length > 0, 'Home page rendered blank');

  console.log(JSON.stringify({
    passed: true,
    signingRequests: signingRequests.map((request) => request.action),
    screenshotPath,
    browserErrors,
  }));
} finally {
  await browser.close();
}
