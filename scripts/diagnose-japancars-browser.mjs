import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
try {
  const page=await browser.newPage();
  const documents=[];
  await page.route('**/*',route=>['image','media','font'].includes(route.request().resourceType())?route.abort():route.continue());
  page.on('response',r=>{if(r.request().resourceType()==='document')documents.push({status:r.status(),challenge:r.headers()['cf-mitigated']||null});});
  await page.goto('https://www.japancars.co.jp/stock-list?country=Japan&perPage=10&page=1',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(8000);
  console.log(JSON.stringify({mode:'standard Chromium, no stealth or CAPTCHA interaction',documents,title:await page.title(),listingRows:await page.locator('.stock_list.vehicle_redirect').count(),challengeText:(await page.locator('body').innerText()).slice(0,500)},null,2));
} finally {await browser.close();}
