import { useEffect, useState } from 'react';
import { invokeAdminFunction } from '../lib/adminApi';

type Fault = {stage:string;message:string;occurredAt?:string;httpStatus?:number;jobId?:string;host?:string};
type Worker = {id:string;seenAt:string|null;runtime:{version?:string;lastError?:Fault|null;active?:{id:string;vehicle:string;host:string;stage:string;since:string}[]}};
type Report = {
 checkedAt:string;processingEnabled:boolean;splitEnabled:boolean;
 pause:null|{by:string;at:string;reason:string;stage?:string;message?:string};
 workers:Worker[];
 totals:{worker:string|null;completed:number;failed:number;processing:number;interrupted:number;last_completed_at:string|null}[];
 errors:{id:number;created_at:string;worker_source_group:string|null;photo_id:string;vehicle:string;source_host:string;stage:string;message:string;http_status:number|null}[];
 active:{id:string;vehicle:string;host:string;worker_source_group:string|null;lease_until:string;updated_at:string}[];
 failures:{id:string;vehicle:string;host:string;worker_source_group:string|null;error:string;updated_at:string}[];
};
const names:Record<string,string>={windows:'Windows',mac:'Mac mini',admin:'管理员',unknown:'未记录机器'};
const stages:Record<string,string>={download:'来源下载／等待限速',decode:'解码图片',detect:'检测水印',repair:'修补水印',encode:'压缩成品',upload_original:'上传原图',upload_verify:'上传成品／云端校验',cloud_claim:'领取任务',cloud_complete:'上传成品／云端校验',cloud_original:'上传原图',cloud_fail:'上报失败',cloud_cleanup_approved:'清理已审核原图',cloud_pause_source:'通知暂停',unknown:'步骤未上报（旧版或采样间隔）'};
const when=(value?:string|null)=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('zh-CN'):'未记录';
const machine=(value?:string|null)=>names[value||'unknown']||'未记录机器';
function advice(message:string){
 if(/SOURCE_HTTP_(401|403)/.test(message))return '来源网站拒绝访问。检查该机器能否访问来源；仅凭此错误不能断定 IP 被封。';
 if(/SOURCE_HTTP_429/.test(message))return '来源网站限流。队列会暂停，先等待并检查限速，不要连续重试。';
 if(/PHOTO_CAPACITY_LIMIT/.test(message))return '照片功能达到存储预留上限。检查容量后再重试。';
 if(/checksum|verification|verified/i.test(message))return '成品校验未通过，照片不会自动发布。检查上传后重试。';
 if(/Cloud HTTP 5|timeout|timed out|reset|connection|network|SSL|DNS|10060|连接尝试失败/i.test(message))return '网络或云端连接异常。检查对应机器网络及 Supabase 状态；仅凭此错误不能确定哪一端断网。';
 if(/Authentication|401/.test(message))return '检查该机器的专用连接配置；不要把令牌粘贴到聊天或日志。';
 return '按下方步骤和错误原文定位；不要将推测当成已确定的原因。';
}

export function PhotoWorkerDetails(){
 const [open,setOpen]=useState(false),[report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[refreshKey,setRefreshKey]=useState(0);
 useEffect(()=>{
  if(!open)return;
  let active=true,inFlight=false;
  const load=async()=>{if(inFlight||document.hidden)return;inFlight=true;try{const value=await invokeAdminFunction<Report>('japan-photo-review',{action:'details'});if(active){setReport(value);setError('');}}catch(e){if(active)setError(e instanceof Error?e.message:'运行详情读取失败');}finally{inFlight=false;}};
  void load();const timer=window.setInterval(()=>void load(),15000);
  return()=>{active=false;window.clearInterval(timer);};
 },[open,refreshKey]);
 return <section className="photo-worker-details">
  <button type="button" aria-expanded={open} aria-controls="photo-worker-report" onClick={()=>setOpen(v=>!v)}>{open?'收起运行详情':'运行详情 · 机器与错误'}</button>
  {open&&<div id="photo-worker-report">
   <div className="photo-controls"><p>展开时每 15 秒更新，不加载照片。最近读取：{when(report?.checkedAt)}</p><button onClick={()=>setRefreshKey(v=>v+1)}>刷新详情</button></div>
   {error&&<p role="alert" className="photo-error">{error}；已有信息可能过时。</p>}
   {!report&&!error&&<p>正在读取运行详情…</p>}
   {report&&<>
    <p>{report.processingEnabled?'队列允许处理':'队列已暂停'}{report.pause&&` · 操作方：${machine(report.pause.by)} · ${when(report.pause.at)} · ${report.pause.reason==='manual'?'手动暂停':'来源访问异常触发暂停'}`}</p>
    {report.pause?.message&&<p className="photo-error">{report.pause.message}</p>}
    <div className="photo-worker-cards">{report.workers.map(worker=>{
     const online=!!worker.seenAt&&Date.now()-Date.parse(worker.seenAt)<120000;
     const totals=report.totals.find(t=>t.worker===worker.id);
     const jobs=report.active.filter(j=>j.worker_source_group===worker.id);
     return <article key={worker.id}>
      <h3>{machine(worker.id)} · {online?'最近有联络':'未连接／联络超时'}</h3>
      <p>来源：{worker.id==='mac'?'Japan Cars':report.splitEnabled?'919919 / GABS':'全部来源（等待 Mac 接入）'}</p>
      <p>最后联络：{when(worker.seenAt)}<br/>最后完成：{when(totals?.last_completed_at)}</p>
      <p>已完成 {totals?.completed||0} · 处理中 {totals?.processing||0} · 失败 {totals?.failed||0} · 租约过期 {totals?.interrupted||0}</p>
      {!online&&<p>无法仅凭未联络区分关机、睡眠、网络故障或程序退出。请检查这台机器的服务和日志。</p>}
      {!worker.runtime?.version&&<p>旧版程序：可查看机器与任务状态；详细处理步骤需要更新程序。</p>}
      {jobs.map(job=>{const step=worker.runtime?.active?.find(j=>j.id===job.id);return <div className="photo-worker-job" key={job.id}><strong>{job.vehicle}</strong><p>{job.host} · {stages[step?.stage||'unknown']||step?.stage}<br/>任务编号：{job.id}<br/>租约到期：{when(job.lease_until)}</p></div>;})}
      {worker.runtime?.lastError&&<div className="photo-worker-fault"><strong>最近一次上报的错误（不代表仍在故障）</strong><p>{when(worker.runtime.lastError.occurredAt)} · {stages[worker.runtime.lastError.stage]||worker.runtime.lastError.stage}</p><p>{worker.runtime.lastError.message}</p><p>{advice(worker.runtime.lastError.message)}</p></div>}
     </article>;
    })}</div>
    <h3>当前失败任务</h3>
    {!report.failures.length&&<p>当前没有失败任务。</p>}
    {report.failures.map(job=><div className="photo-worker-fault" key={job.id}><strong>{machine(job.worker_source_group)} · {job.vehicle}</strong><p>{when(job.updated_at)} · {job.host}<br/>任务编号：{job.id}</p><p>{job.error}</p><p>{advice(job.error)}</p></div>)}
    <h3>最近错误记录</h3><p>最多显示最近 30 条；重试后仍保留。旧版未记录的步骤不能追溯。</p>
    {!report.errors.length&&<p>诊断功能启用后暂无错误记录。</p>}
    {report.errors.map(event=><details className="photo-worker-fault" key={event.id}><summary>{when(event.created_at)} · {machine(event.worker_source_group)} · {stages[event.stage]||event.stage}{event.http_status?` · HTTP ${event.http_status}`:''}</summary><p>{event.vehicle} · {event.source_host}<br/>任务编号：{event.photo_id}</p><p>{event.message}</p><p>{advice(event.message)}</p></details>)}
    <p>历史任务若未记录机器，不会强行归给 Windows 或 Mac。机器统计按最后领取者归属；详情读取失败时不会判定处理程序已经停止。</p>
   </>}
  </div>}
 </section>;
}
