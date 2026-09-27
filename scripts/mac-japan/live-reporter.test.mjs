import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createReporter,describeProgress} from './live-reporter.mjs';
it('reports progress without uploading raw logs, source URLs or credentials in the body',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'inno-live-test-'));
  const config=path.join(root,'connection.json');
  fs.writeFileSync(config,JSON.stringify({endpoint:'https://prgjtdndhkeceikrthal.supabase.co/functions/v1/japan-photo-review',token:'a'.repeat(64)}));
  const fetcher=vi.fn(async()=>({ok:true}));
  const reporter=createReporter(root,config,{fetcher,intervalMs:100000});
  try{
    await new Promise(r=>setTimeout(r,0));
    reporter.progress({status:'running',metrics:{stage:'details',rotationMake:'Subaru',rotationModel:'Impreza',detailSucceeded:18,accepted:12},logs:[{text:'private raw log'}]});
    await new Promise(r=>setTimeout(r,0));
    const body=JSON.parse(fetcher.mock.calls.at(-1)[1].body);
    expect(body.message).toContain('18 辆详情');
    expect(body.state).toBe('running');
    expect(JSON.stringify(body)).not.toContain('private raw log');
    expect(JSON.stringify(body)).not.toContain('a'.repeat(64));
    const actionTime=body.lastActionAt;
    await reporter.flush();
    expect(JSON.parse(fetcher.mock.calls.at(-1)[1].body).lastActionAt).toBe(actionTime);
    reporter.update('paused','采集已暂停');
    await new Promise(r=>setTimeout(r,0));
    expect(JSON.parse(fetcher.mock.calls.at(-1)[1].body).state).toBe('paused');
  }finally{reporter.close();fs.rmSync(root,{recursive:true,force:true});}
});
it('uses simple stage and page descriptions',()=>{
  expect(describeProgress({metrics:{stage:'listing',rotationMake:'Toyota',rotationCursor:{page:2}}})).toContain('正在读取车辆列表 · Toyota · 第 2 页');
});
