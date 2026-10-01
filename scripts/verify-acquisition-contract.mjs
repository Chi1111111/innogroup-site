import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const origin='http://127.0.0.1:5186';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:1100},permissions:['clipboard-read','clipboard-write']});
await context.addInitScript(()=>sessionStorage.setItem('inno:admin-session:v1','isolated-acquisition-test'));
let rows=[];let signatures=0;const errors=[];
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.endsWith('/functions/v1/admin-api')){
  const body=route.request().postDataJSON();
  if(body.action==='session.verify')return route.fulfill({json:{data:{valid:true}}});
  if(body.action==='contracts.list')return route.fulfill({json:{data:rows}});
  if(body.action==='contracts.upsert'){const row={...body.row,created_at:body.row.payload.createdAt};rows=[row,...rows.filter(r=>r.id!==row.id)];return route.fulfill({json:{data:{saved:true}}});}
  return route.fulfill({json:{data:[]}});
 }
 if(url.pathname==='/rest/v1/contracts')return route.fulfill({json:rows[0]});
 if(url.pathname.endsWith('/functions/v1/contract-signing')){
  const body=route.request().postDataJSON();
  if(body.action==='sign'){
   signatures++;assert.equal(body.signerName,'Example Seller');assert.match(body.signatureData,/^data:image\/png;base64,/);
   rows[0].status='signed';rows[0].signed_at=new Date().toISOString();
   rows[0].payload.signatures.purchaserName=body.signerName;rows[0].payload.signatures.purchaser=body.signatureData;
   return route.fulfill({json:{data:{signedAt:rows[0].signed_at}}});
  }
  return route.fulfill({json:{data:{viewed:true}}});
 }
 if(url.origin!==origin)return route.abort();return route.continue();
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`${origin}/admin/contracts`);await page.getByRole('heading',{name:'合同管理后台'}).waitFor();
 await page.getByRole('button',{name:'合同库',exact:true}).click();
 const template=page.getByRole('heading',{name:'收车合同',exact:true}).locator('..').locator('..').locator('..');
 await template.getByRole('button',{name:'使用这个合同'}).click();
 await page.getByRole('button',{name:'卖方资料',exact:true}).waitFor();
 assert.equal(rows[0].contract_type,'vehicle-purchase');assert.equal(rows[0].payload.contractType,'vehicle-acquisition');
 await page.getByRole('button',{name:'复制链接',exact:true}).click();
 assert.equal(rows[0].status,'draft');
 await page.getByLabel('姓名',{exact:true}).fill('Example Seller');
 await page.getByLabel('驾照号',{exact:true}).fill('SAMPLE-ID');
 await page.getByLabel('邮箱（可多个）',{exact:true}).fill('seller@example.test');
 await page.getByLabel('电话',{exact:true}).fill('021 000 0000');
 await page.getByLabel('地址',{exact:true}).fill('Sample address, Auckland');
 await page.getByRole('button',{name:'车辆',exact:true}).click();
 for(const [label,value] of [['车牌号 / Registration','SAMPLE'],['品牌','BMW'],['型号','X4M Competition'],['车辆年份','2020'],['VIN / 车架号','SAMPLEVIN000000001'],['公里数','42,000'],['颜色','Grey'],['WOF 信息','Valid until 01 October 2027']])await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('button',{name:'收购及交车',exact:true}).click();
 const values={'协议日期 / Agreement date':'01 October 2026','收购总价（NZD）/ Purchase price':'68000','已付给车主的订金（NZD）/ Deposit paid':'1000','直接付给贷款机构（NZD）/ Finance payout':'12000','贷款机构 / Finance company':'Example Finance','贷款结清编号 / Payout reference':'PAYOUT-SAMPLE','车主账户名 / Account holder':'Example Seller','车主银行账号 / Bank account':'00-0000-0000000-00','付款日期 / Payment date':'05 October 2026','交车日期及时间 / Handover date & time':'05 October 2026, 10:00 NZDT','交车地点 / Handover location':'Agreed Auckland location','钥匙、配件及文件 / Keys, accessories & documents':'Two keys and service records. / 两把钥匙及保养记录。','事故、故障及里程异常披露 / Condition disclosures':'Seller reports no known accident or odometer issues; minor wear on wheels. / 卖方未发现事故或里程异常，轮毂有轻微磨损。','贷款及其他权益披露（无请填 None）/ Security interests':'Example Finance loan; NZD 12,000 payout subject to current settlement letter. / 贷款 NZD 12,000，以结清函为准。','验车条件及其他约定 / Inspection & special conditions':'Buyer inspection to be completed before settlement. Any repair or price change must be agreed in writing. / 结算前完成验车，维修或调价另行书面确认。'};
 for(const [label,value]of Object.entries(values))await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('status').filter({hasText:'应付车主尾款'}).getByText('应付车主尾款：NZD $55,000.00').waitFor();
 await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.getByText('合同草稿已保存。',{exact:true}).waitFor();
 await page.screenshot({path:'tmp/acquisition-review/editor-desktop.png'});
 await page.getByRole('button',{name:'复制链接',exact:true}).click();await page.getByText('合同已保存为已发送。',{exact:true}).waitFor();
 assert.equal(rows[0].status,'sent');
 fs.writeFileSync('tmp/acquisition-review/sample-row.json',JSON.stringify(rows[0]));
 await page.reload();await page.getByRole('button',{name:'合同库',exact:true}).click();
 await page.getByRole('button').filter({hasText:'Example Seller'}).click();
 await page.getByRole('button',{name:'卖方资料',exact:true}).waitFor();
 assert.match(await page.locator('.acquisition-document').first().innerText(),/55,000.00/);
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'tmp/acquisition-review/editor-mobile.png'});
 await page.setViewportSize({width:1200,height:1100});
 await page.emulateMedia({media:'print'});
 await page.pdf({path:'output/pdf/vehicle-acquisition-sample.pdf',format:'A4',preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:'screen'});
 await page.goto(`${origin}/sign/${rows[0].signing_token}`);
 await page.getByRole('button',{name:'Sign document'}).first().click();
 await page.getByRole('heading',{name:'Finish signing',exact:true}).waitFor();
 assert.equal(await page.getByText('I acknowledge the Consumer Information Notice has been provided.',{exact:true}).count(),0);
 const checks=page.locator('input[type=checkbox]');assert.equal(await checks.count(),6);
 for(let i=0;i<6;i++)await checks.nth(i).check();
 const canvas=page.locator('canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
 await page.mouse.move(box.x+30,box.y+40);await page.mouse.down();await page.mouse.move(box.x+140,box.y+80,{steps:10});await page.mouse.up();
 await page.getByRole('button',{name:'Finish signing',exact:true}).click();await page.getByRole('heading',{name:'Signing completed'}).waitFor();assert.equal(signatures,1);
 await page.locator('.acquisition-document').last().scrollIntoViewIfNeeded();
 await page.locator('.acquisition-page').last().screenshot({path:'tmp/acquisition-review/signed-terms.png'});
 assert.deepEqual(errors,[]);console.log('PASS acquisition create, validation, balance, save/reload, mobile, PDF export, seller signing.');
}catch(e){console.log((await page.locator('body').innerText()).slice(-9000));console.log(JSON.stringify(rows).slice(0,500));await page.screenshot({path:'tmp/acquisition-review/failure.png'});throw e;}finally{await browser.close();}
