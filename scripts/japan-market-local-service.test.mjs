import { request as httpRequest } from 'node:http';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createLocalService } from './japan-market-local-service.mjs';

test('local service rejects foreign origins/tokens and prevents concurrent scans', async () => {
  let starts = 0;
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const { server } = createLocalService({ token: 'test-pairing', launch: () => { starts++; return child; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const call = (path, method = 'GET', overrides = {}) => fetch(url + path, { method, headers: { Host: `127.0.0.1:${server.address().port}`, Origin: 'https://www.innogroup.co.nz', Authorization: 'Bearer test-pairing', ...overrides } });
  try {
    assert.equal((await call('/scan', 'POST', { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await call('/scan', 'POST', { Authorization: 'Bearer wrong' })).status, 401);
    assert.equal(await new Promise((resolve, reject) => { const req = httpRequest(url + '/scan', { method: 'POST', headers: { Host: 'evil.example', Origin: 'https://www.innogroup.co.nz', Authorization: 'Bearer test-pairing' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); }), 403);
    assert.equal((await call('/scan', 'OPTIONS')).status, 204);
    assert.equal(starts, 0);
    assert.equal((await call('/scan', 'POST')).status, 202);
    assert.equal((await call('/scan', 'POST')).status, 409);
    assert.equal(starts, 1);
    assert.equal((await (await call('/status')).json()).status, 'running');
    child.emit('message', { type: 'progress', metrics: { stage: 'details', accepted: 12, withFobPrice: 10, photoCount: 155, published: true, added: 12 } });
    const live = await (await call('/status')).json();
    assert.equal(live.metrics.accepted, 12);
    assert.equal(live.metrics.photoCount, 155);
    child.stderr.emit('data', Buffer.from('Source access challenge; collection stopped.'));
    assert.match((await (await call('/status')).json()).logs[0].text, /access challenge/);
    child.emit('close', 0);
    assert.equal((await (await call('/status')).json()).status, 'finished');
    assert.equal((await (await call('/status')).json()).metrics.accepted, 12);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

async function batchHarness(run) {
  const children=[]; const settings=[]; let queued; let cancelled=false;
  const {server}=createLocalService({token:'pair', launch: options=>{ const child=new EventEmitter(); children.push(child); settings.push(options); return child; },
    schedule: callback=>{queued=callback;return 1;}, cancel:()=>{cancelled=true;queued=undefined;}, now:()=>100000 });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const call=(path,method='GET')=>fetch(`http://127.0.0.1:${server.address().port}${path}`,{method,headers:{Origin:'https://www.innogroup.co.nz',Authorization:'Bearer pair'}});
  const done=(metrics,code=0)=>{const child=children.at(-1);child.emit('message',{type:'progress',metrics});child.emit('close',code);};
  try {await run({call,children,settings,done,next:()=>{const fn=queued;queued=undefined;fn?.();},isQueued:()=>!!queued,isCancelled:()=>cancelled});}
  finally {await new Promise(resolve=>server.close(resolve));}
}
test('starts another batch only after confirmed upload, caps the combined target and prevents clicks during the gap',()=>batchHarness(async({call,children,settings,done,next,isQueued})=>{
  await call('/scan','POST');
  done({published:true,added:144,accepted:144,stopCode:'BATCH_CONTENT_MISSING'});
  assert.equal(children.length,1);assert.equal(isQueued(),true);
  assert.equal((await call('/scan','POST')).status,409);
  assert.equal((await (await call('/status')).json()).metrics.totalAdded,144);
  next();assert.equal(children.length,2);assert.equal(settings[1].target,4856);
  done({published:true,added:4856,accepted:4856,stopCode:'BATCH_CONTENT_MISSING'});
  const result=await (await call('/status')).json();
  assert.equal(result.status,'finished');assert.equal(result.metrics.totalAdded,5000);assert.equal(isQueued(),false);
}));
test('never restarts after failed uploads, no progress, explicit blocks or unrelated failures',async()=>{
  for(const metrics of [{published:false,added:144},{published:true,added:0},{published:true,added:144,sourceAccessBlocked:true},{published:true,added:144,stopCode:'OTHER'}]) {
    await batchHarness(async({call,done,isQueued})=>{
      await call('/scan','POST');done({stopCode:'BATCH_CONTENT_MISSING',...metrics});
      assert.equal(isQueued(),false);assert.notEqual((await (await call('/status')).json()).status,'running');
    });
  }
  await batchHarness(async({call,done,isQueued})=>{await call('/scan','POST');done({published:true,added:144,stopCode:'BATCH_CONTENT_MISSING'},1);assert.equal(isQueued(),false);});
});
test('stop-after-batch preserves current work and cancels waiting batches',async()=>{
  await batchHarness(async({call,done,isQueued})=>{await call('/scan','POST');await call('/stop-after-batch','POST');done({published:true,added:144,stopCode:'BATCH_CONTENT_MISSING'});assert.equal(isQueued(),false);});
  await batchHarness(async({call,done,isQueued,isCancelled})=>{await call('/scan','POST');done({published:true,added:144,stopCode:'BATCH_CONTENT_MISSING'});await call('/stop-after-batch','POST');assert.equal(isQueued(),false);assert.equal(isCancelled(),true);assert.equal((await (await call('/status')).json()).status,'finished');});
});
