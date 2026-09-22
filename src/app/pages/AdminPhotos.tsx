import { useCallback, useEffect, useRef, useState } from 'react';
import { invokeAdminFunction } from '../lib/adminApi';
import '../../styles/admin-photos.css';

type Photo = {id:string;vehicle:string;status:string;original_url:string|null;candidate_url:string|null;candidate_bytes:number;candidate_verified:boolean;error?:string;detection:{detected?:boolean;format?:string}};
type Listing = {workerSeenAt?:string|null;items:Photo[];counts:Record<string,number>;usedBytes:number;budgetBytes:number;processingEnabled:boolean;registeredVehicles:number;publishedVehicles:number};
const labels:Record<string,string>={queued:'排队中',processing:'处理中',pending_review:'修复待审',needs_inspection:'疑似水印，需检查',approved:'已通过',rejected:'已拒绝',failed:'失败',capacity_blocked:'容量暂停'};
const api=<T,>(action:string,body:Record<string,unknown>={})=>invokeAdminFunction<T>('japan-photo-review',{action,...body});
export function AdminPhotos(){
 const [filter,setFilter]=useState('pending_review');
 const [data,setData]=useState<Listing|null>(null),[size,setSize]=useState(20),[offset,setOffset]=useState(0),[selected,setSelected]=useState<Set<string>>(new Set()),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[zoom,setZoom]=useState<Photo|null>(null),[decision,setDecision]=useState<string|null>(null),[ack,setAck]=useState(false);
 const [progressError,setProgressError]=useState(false),[progressAt,setProgressAt]=useState<Date|null>(null);
 const sequence=useRef(0);
 const load=useCallback(async()=>{const request=++sequence.current;setBusy(true);setError('');try{const result=await api<Listing>('list',{status:filter,pageSize:size,offset});if(request===sequence.current){setData(result);setSelected(new Set());}}catch(e){if(request===sequence.current)setError(e instanceof Error?e.message:'读取失败');}finally{if(request===sequence.current)setBusy(false);}},[filter,size,offset]);
 useEffect(()=>{void load();const currentSequence=sequence;return()=>{currentSequence.current++;};},[load]);
 useEffect(()=>{
  if(busy)return;
  let active=true,inFlight=false;
  const refresh=async()=>{if(document.hidden||inFlight)return;inFlight=true;try{const stats=await api<Omit<Listing,'items'>>('status');if(active){setData(previous=>previous?{...previous,...stats}:previous);setProgressError(false);setProgressAt(new Date());}}catch{if(active)setProgressError(true);}finally{inFlight=false;}};
  const timer=window.setInterval(()=>void refresh(),10000);
  return()=>{active=false;window.clearInterval(timer);};
 },[busy]);
 const toggle=(id:string)=>setSelected(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});
 const eligible=(p:Photo)=>['pending_review','needs_inspection','approved','rejected'].includes(p.status);
 const chosen=data?.items.filter(p=>selected.has(p.id))||[];
 const run=async(action:string,body:Record<string,unknown>,message:string)=>{setBusy(true);setError('');try{await api(action,body);setDecision(null);setNotice(message);await load();}catch(e){setError(e instanceof Error?e.message:'操作失败');setBusy(false);}};
 const count=data?.counts[filter]||0;
 const totals=data?.counts||{};
 const total=Object.values(totals).reduce((a,b)=>a+b,0);
 const completed=['pending_review','needs_inspection','approved','rejected'].reduce((sum,key)=>sum+(totals[key]||0),0);
 const percent=total?Math.min(100,completed/total*100):0;
 const localConnected=!!data?.workerSeenAt&&Date.now()-Date.parse(data.workerSeenAt)<120000;
 const pipelineState=!data?'读取中':!data.processingEnabled?'已暂停':!localConnected?'等待本地程序连接':totals.processing?'本地处理中':total&&completed===total?'处理完成':'本地程序在线';
 return <section className="photo-admin"><h1>图片处理与自动上架</h1><p>本地单线程处理已有库存，每张完成后间隔 2 秒再下载下一张。照片仅在内存中处理并上传 Supabase，不保存到本地硬盘；关机后暂停，重新启动后续跑。不调用大模型。处理后的照片自动上传；未检测到已知 JAPANCARS 水印的照片自动通过，这里仅展示明确检测到水印的照片；不确定的照片在“疑似水印”中单独检查，审核通过前会阻止对应车辆上架。车辆全部照片通过且文件校验成功后自动上架。</p>
 {error&&<p role="alert" className="photo-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <section className="photo-progress-panel" aria-label="本地处理进度">
 <div className="photo-progress-heading"><span className={`photo-live-dot ${data?.processingEnabled&&localConnected?'enabled':''}`}/><strong>{pipelineState}</strong><span className="photo-progress-percent">{percent.toFixed(1)}<small>%</small></span></div>
 <div className="photo-progress-track" role="progressbar" aria-label="照片处理进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(percent.toFixed(1))} aria-valuetext={`已处理 ${completed} 张，共 ${total} 张`}><div style={{width:`${percent}%`}}/></div>
 <div className="photo-progress-numbers"><span>已处理 <b>{completed.toLocaleString()}</b> / {total.toLocaleString()} 张</span><span>排队 <b>{(totals.queued||0).toLocaleString()}</b></span><span>处理中 <b>{totals.processing||0}</b></span><span className={totals.failed?'photo-error':''}>失败 <b>{totals.failed||0}</b></span>{!!totals.capacity_blocked&&<span>容量暂停 {totals.capacity_blocked}</span>}</div>
 <p className="photo-progress-caption">{progressError?'进度刷新失败，保留上次结果；稍后自动重试。':`每 10 秒更新进度${progressAt?' · '+progressAt.toLocaleTimeString('zh-CN'):''}`} · 按已入队照片计算，登记期间总数会增加。处理完成不等于审核通过。</p>
 </section>
 <div className="photo-stats"><strong>{localConnected?'本地程序已连接':'本地程序未连接'}</strong><span>已登记 {data?.registeredVehicles??0} 辆 · 已上架 {data?.publishedVehicles??0} 辆</span><span>预留 {((data?.usedBytes||0)/1e9).toFixed(2)} / {((data?.budgetBytes||0)/1e9).toFixed(1)} GB</span></div>
 <p>{Object.entries(data?.counts||{}).map(([key,value])=>`${labels[key]||key} ${value}`).join(' · ')}</p>
 <div className="photo-controls"><button disabled={busy||!data} onClick={()=>void run('control',{enabled:!data?.processingEnabled},data?.processingEnabled?'已暂停领取新图片，正在处理的图片会完成。':'队列已允许继续；本地程序运行时会领取下一张。')}>{data?.processingEnabled?'暂停处理':'允许继续'}</button><button disabled={busy} onClick={()=>void run('retry',{},'失败任务已重新排队。')}>重试失败项</button><button disabled={busy} onClick={()=>void load()}>刷新照片列表</button><span className="photo-local-badge">本地执行 · Supabase 存储 · 无模型 token</span></div>
 <p>本地程序需要保持运行。遇到来源 403／429 会自动暂停，不会反复请求；检查原因后再继续。通过审核的成品验证成功后，本地程序会清理云端对应原图；容量显示为保守预留量。拒绝任意照片会使对应车辆停止上架；已签发的图片链接最长一小时失效。</p>
 <details className="photo-local-help"><summary>本地启动与断点续跑</summary><p>在这台电脑打开 INNOGROUP → japan-photo-watermarks → scripts → photo-review，双击 <strong>start-local.ps1</strong>（右键“使用 PowerShell 运行”）。程序会在后台运行，再到这里点击“允许继续”。</p><p>关闭浏览器不会停止程序；关闭电脑会停止。下次启动会跳过已完成照片。重复启动不会增加并发。下载、修补和压缩均在内存中完成；原图与成品只存 Supabase，电脑仅保留程序、配置和运行日志。</p><p>已连接表示最近两分钟内收到程序联络；“允许继续”只开放队列，不会远程开启已关机的电脑。</p></details>
 <div className="photo-controls"><button disabled={busy} aria-pressed={filter==='pending_review'} onClick={()=>{setFilter('pending_review');setOffset(0);}}>已检测到水印（{data?.counts.pending_review||0}）</button><button disabled={busy} aria-pressed={filter==='needs_inspection'} onClick={()=>{setFilter('needs_inspection');setOffset(0);}}>疑似水印（{data?.counts.needs_inspection||0}）</button><select aria-label="每页数量" disabled={busy} value={size} onChange={e=>{setSize(Number(e.target.value));setOffset(0);}}>{[20,50,100].map(n=><option key={n} value={n}>每页 {n} 张</option>)}</select></div>
 <div className="photo-grid">{data?.items.map(p=><article key={p.id}><label><input type="checkbox" checked={selected.has(p.id)} disabled={busy||!eligible(p)} onChange={()=>toggle(p.id)}/>{p.vehicle}</label><small>{labels[p.status]} · {Math.round(p.candidate_bytes/1000)} KB</small><button className="photo-pair photo-preview" onClick={()=>setZoom(p)} aria-label={`对比 ${p.vehicle}`}><span>{p.candidate_url?<img loading="lazy" decoding="async" src={p.candidate_url} alt="待审核成品"/>:'暂无成品'}<small>{p.detection?.detected?'修补结果 · 点击对比原图':'疑似水印 · 点击检查原图'}</small></span></button>{p.error&&<p className="photo-error">{p.error}</p>}</article>)}</div>
 {!busy&&data?.items.length===0&&<p>{filter==='pending_review'?'当前没有明确检测到水印的待审核照片；可点击“疑似水印”检查不确定的结果。':'当前没有疑似水印照片。'}</p>}
 <div className="photo-controls"><button disabled={busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-size))}>上一页</button><span>第 {offset/size+1} 页 · 共 {count} 张</span><button disabled={busy||offset+size>=count} onClick={()=>setOffset(offset+size)}>下一页</button></div>
 <div className="photo-bulk"><button disabled={busy} onClick={()=>setSelected(new Set(data?.items.filter(eligible).map(p=>p.id)))}>本页全选</button><button disabled={busy} onClick={()=>setSelected(new Set())}>取消全选</button><strong>已选 {selected.size} 张</strong><button disabled={busy||!chosen.length||chosen.some(p=>!p.candidate_url||!p.candidate_verified)} onClick={()=>{setDecision('approved');setAck(false);}}>批量通过</button><button disabled={busy||!chosen.length} onClick={()=>{setDecision('rejected');setAck(false);}}>批量拒绝</button></div>
 {zoom&&<div className="photo-overlay"><div role="dialog" aria-modal="true" aria-label="图片对比" className="photo-dialog"><button onClick={()=>setZoom(null)}>关闭</button><h2>{zoom.vehicle}</h2><div className="photo-pair">{zoom.original_url&&<img src={zoom.original_url} alt="原图"/>}{zoom.candidate_url&&<img src={zoom.candidate_url} alt="成品"/>}</div><div className="photo-controls"><button disabled={data?.items[0]?.id===zoom.id} onClick={()=>{const i=data!.items.findIndex(p=>p.id===zoom.id);setZoom(data!.items[i-1]);}}>上一张</button><button disabled={!eligible(zoom)||busy} onClick={()=>toggle(zoom.id)}>{selected.has(zoom.id)?'取消选择':'选择此图'}</button><button disabled={data?.items.at(-1)?.id===zoom.id} onClick={()=>{const i=data!.items.findIndex(p=>p.id===zoom.id);setZoom(data!.items[i+1]);}}>下一张</button></div></div></div>}
 {decision&&<div className="photo-overlay"><div role="dialog" aria-modal="true" aria-label="确认批量审核" className="photo-dialog small"><h2>{decision==='approved'?'通过':'拒绝'} {selected.size} 张照片</h2><p>车辆全部照片通过后自动公开展示，无需再次手动上架。</p><label><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/>{decision==='approved'?'我已检查成品，确认无残留水印且未影响车辆信息，并确认可以公开展示。':'确认拒绝这些照片，并停止展示受影响的车辆。'}</label>{error&&<p role="alert">{error}</p>}<div className="photo-controls"><button disabled={busy} onClick={()=>setDecision(null)}>取消</button><button disabled={!ack||busy} onClick={()=>void run('decide-batch',{ids:[...selected],decision},'审核已保存，车辆上架状态已自动更新。')}>{busy?'正在保存…':'确认'}</button></div></div></div>}
 </section>;
}
