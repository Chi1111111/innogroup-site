import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function describeProgress(status) {
  const m=status.metrics || {};
  const location=[m.rotationMake,m.rotationModel].filter(Boolean).join(' / ');
  const page=m.rotationCursor?.page;
  const stages={configuration:'正在准备采集',catalog:'正在读取品牌和车型目录',listing:'正在读取车辆列表',details:'正在读取车辆详情',validation:'正在检查车辆信息',publish:'正在发布这一批车辆',upload_retry:'发布暂时失败，等待重试',complete:'这一批采集已结束',between_batches:'这一批已发布，等待下一批',cooldown:'来源暂时不可用，等待后再检查',access:'来源访问受限'};
  return `${stages[m.stage] || '正在等待采集进度'}${location?' · '+location:''}${page?' · 第 '+page+' 页':''} · 已读取 ${Number(m.detailSucceeded)||0} 辆详情，找到 ${Number(m.accepted)||0} 辆符合条件的车`;
}
export function createReporter(root, configPath, {fetcher=fetch,intervalMs=10000}={}) {
  const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
  const expected='https://prgjtdndhkeceikrthal.supabase.co/functions/v1/japan-photo-review';
  if(config.endpoint!==expected || !/^[a-f0-9]{64}$/.test(config.token)) throw new Error('Invalid reporter configuration');
  const file=path.join(root,'collector-live.json');
  let events=[];
  try { events=JSON.parse(fs.readFileSync(file,'utf8')).events || []; } catch { /* First launch. */ }
  let state={version:1,session:randomUUID(),state:'starting',message:'采集程序正在启动',lastActionAt:null,nextRunAt:null,events};
  let busy=false;
  let signature='';
  const flush=async()=>{
    if(busy)return;
    busy=true;
    try {
      state.events=state.events.filter(e=>Date.parse(e.at)>Date.now()-86400000).slice(-100);
      fs.writeFileSync(file,JSON.stringify(state),{mode:0o600});
      const result=await fetcher(expected.replace('japan-photo-review','japan-collector-live'),{method:'POST',headers:{'Content-Type':'application/json','X-Photo-Token':config.token},body:JSON.stringify(state),signal:AbortSignal.timeout(7000)});
      if(!result.ok)console.error('采集状态上传暂时失败；10 秒后重试，不影响采集。');
    } catch { console.error('采集状态暂时无法上传；稍后自动重试，不影响采集。'); }
    finally {busy=false;}
  };
  const update=(next,message,nextRunAt=null)=>{
    if(state.state!==next || state.message!==message) {
      state={...state,state:next,message,nextRunAt,lastActionAt:new Date().toISOString()};
      state.events.push({at:state.lastActionAt,message});
      console.log(message);
      void flush();
    }
  };
  const progress=status=>{
    const m=status.metrics || {};
    const key=JSON.stringify([status.status,m.stage,m.rotationMake,m.rotationModel,m.rotationCursor?.page,m.requests,m.detailRequested,m.detailSucceeded,m.accepted,m.published,m.batchNumber]);
    if(key!==signature){signature=key;update(status.status==='running' && !['cooldown','between_batches','upload_retry'].includes(m.stage)?'running':'waiting',describeProgress(status),m.resumeAt || null);}
  };
  const timer=setInterval(()=>void flush(),intervalMs);
  void flush();
  return {update,progress,flush,close(){clearInterval(timer);}};
}
