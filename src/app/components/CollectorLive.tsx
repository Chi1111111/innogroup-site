import { useEffect, useState } from 'react';
import { invokeAdminFunction } from '../lib/adminApi';

export interface CollectorSnapshot {
  received_at:string;
  snapshot:{state:string;message:string;lastActionAt:string|null;nextRunAt:string|null;events:{at:string;message:string}[]};
}
export function collectorLiveLabel(data:CollectorSnapshot|null,now:number) {
  if(!data)return '尚未接入 Mac 实时日志';
  if(now-Date.parse(data.received_at)>45000)return '连接中断，暂时无法确认是否在跑';
  const s=data.snapshot;
  if(s.state==='paused')return '采集已暂停';
  if(s.state==='stopped')return '采集程序已停止';
  if(s.state==='waiting')return '程序在线，正在等待';
  if(s.state==='starting')return '程序在线，正在启动检查';
  if(!s.lastActionAt || now-Date.parse(s.lastActionAt)>90000)return '程序在线，但采集进度已一段时间没变化';
  return '正在采集，有新的进展';
}
const localTime=(value:string)=>new Date(value).toLocaleString('zh-CN',{timeZone:'Pacific/Auckland',hour12:false});
export function CollectorLive() {
  const [data,setData]=useState<CollectorSnapshot|null>(null);
  const [error,setError]=useState(false);
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    let active=true;
    let timer:ReturnType<typeof setTimeout>;
    const controller=new AbortController();
    const refresh=async()=>{
      try {
        const result=await invokeAdminFunction<CollectorSnapshot|null>('japan-collector-live',{},AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]));
        if(active){setData(result);setError(false);}
      }catch{if(active)setError(true);}
      finally{if(active){setNow(Date.now());timer=setTimeout(()=>void refresh(),5000);}}
    };
    void refresh();
    const clock=setInterval(()=>setNow(Date.now()),1000);
    return()=>{active=false;controller.abort();clearTimeout(timer);clearInterval(clock);};
  },[]);
  const events=data?.snapshot.events.filter(e=>Date.parse(e.at)>now-86400000).slice().reverse() ?? [];
  const seconds=data?Math.max(0,Math.floor((now-Date.parse(data.received_at))/1000)):null;
  return <section className="ajm-panel" aria-label="Mac 采集实时日志">
    <div className="ajm-panel-heading"><div><h2>Mac 此刻在做什么？</h2><p>Mac 每 10 秒报到，页面每 5 秒读取。报到只代表程序在线，采集动作会单独记录。</p></div></div>
    <h3 role="status">{error?'实时连接暂时读不到，当前状态待确认':collectorLiveLabel(data,now)}</h3>
    {data?<><p><strong>最后报到：{seconds} 秒前</strong>（{localTime(data.received_at)}）</p><p>最后采集动作：{data.snapshot.lastActionAt?localTime(data.snapshot.lastActionAt):'尚未收到'}</p><p>{data.snapshot.message}</p>{data.snapshot.nextRunAt && <p>预计再次检查或开始：{localTime(data.snapshot.nextRunAt)}</p>}</>:<p>需要在 Mac 安装“实时日志小更新”。接入前不能用旧断点、图片心跳判断采集正在运行。</p>}
    {error && data && <p role="alert">下面保留上次收到的记录；页面正在自动重试。</p>}
    <div style={{maxHeight:360,overflowY:'auto'}} aria-label="最近采集动作">
      {events.map((e,i)=><article className="ajm-log-item" key={`${e.at}-${i}`}><time>{localTime(e.at)}</time><p>{e.message}</p></article>)}
      {data && !events.length && <p>最近 24 小时尚未收到采集动作。</p>}
    </div><small>显示最近 100 条动作，最长保留 24 小时。没有新动作不会伪造“正在爬取”的日志。</small>
  </section>;
}
