import { LocalJapanMarketRunner } from '../components/LocalJapanMarketRunner';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, CarFront, Check, Clock3, Download, Images, LayoutDashboard, RefreshCw, Search, type LucideIcon } from 'lucide-react';
import { loadCollectionReport, type CollectionReport, type CollectionRun, type CollectionVehicleChange } from '../../data/japanMarketSync';
import { formatNzd, japanMarketVehiclePath, loadJapanMarketInventory, type JapanMarketVehicleSummary } from '../../data/japanMarket';
import { invokeAdminFunction } from '../lib/adminApi';
import '../../styles/admin-japan-market.css';

const WORKFLOW = 'https://github.com/Chi1111111/innogroup-site/actions/workflows/japan-market-daily-sync.yml';
const statuses = { success: ['成功', 'success'], partial: ['部分完成', 'warning'], failed: ['采集失败', 'danger'], cancelled: ['已取消', 'muted'] } as const;
const reasons: Record<string,string> = { invalid_record:'记录格式异常', missing_id:'缺少编号', invalid_make:'品牌异常', invalid_model:'车型异常', invalid_year:'年份异常', invalid_mileage:'里程异常', invalid_detail:'详情格式异常', outside_japan:'非日本库存', unavailable:'已售或不可用', missing_photos:'无可用相册', missing_model_slug:'来源详情链接缺少车型', group_mismatch:'车型目录不匹配' };
const number = (v: number | null | undefined) => v == null ? '—' : v.toLocaleString('en-NZ');
const date = (v: string | null | undefined) => v && Number.isFinite(Date.parse(v)) ? new Intl.DateTimeFormat('zh-CN',{timeZone:'Pacific/Auckland',dateStyle:'medium',timeStyle:'short',hour12:false}).format(new Date(v)) : '尚无记录';
function Status({run}: {run?:CollectionRun}) {
  const [label,style] = run ? statuses[run.status] ?? statuses.failed : ['等待首次运行','muted'];
  return <span className={`ajm-badge ${style}`}>{label}</span>;
}
function RunDetails({run,initiallyOpen=false}: {run:CollectionRun;initiallyOpen?:boolean}) {
  const [open,setOpen]=useState(false);
  const [changes,setChanges]=useState<CollectionVehicleChange[]|null>(null);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const [changePage,setChangePage]=useState(1);
  const fields:Record<string,string>={fobPriceNzd:'FOB 价格（NZD）',photoCount:'照片数量',make:'品牌',model:'车型',variant:'配置',year:'年份',mileage:'里程（km）',fuelType:'燃料',transmission:'变速箱',status:'库存状态',sourcePriceType:'源价格类型'};
  const value=(v:unknown)=>v==null?'未记录':typeof v==='number'?number(v):String(v);
  const showChanges=async()=>{
    if(open){setOpen(false);return;}
    setOpen(true);if(changes)return;
    if(!run.metrics.changesPath || !/^changes\/[\w-]+\.json$/.test(run.metrics.changesPath)){setError('此历史任务未记录逐车变更明细。');return;}
    setPending(true);setError('');
    try {
      const response=await fetch(`/data/japan-market/${run.metrics.changesPath}`,{cache:'no-store'});
      if(!response.ok)throw new Error('无法读取更新详情，请稍后重试。');
      const data=await response.json();
      if(!Array.isArray(data.changes))throw new Error('更新详情格式异常。');
      setChanges(data.changes);
    }catch(e){setError(e instanceof Error?e.message:'读取失败');}
    finally{setPending(false);}
  };
  const m=run.metrics;
  const counts: [string,number|null|undefined][]=[['有效车源',m.accepted],['FOB 报价',m.withFobPrice],['相册照片',m.photoCount],['详情失败',m.detailFailed],['过滤车源',m.rejected],['读取页面',m.pagesFetched],['总请求',m.requests],['断点复用',m.cachedDetails],['新增',m.added],['更新',m.updated],['保留旧车',m.retained]];
  return <details className="ajm-run" open={initiallyOpen || undefined}>
    <summary><Status run={run}/><strong>{date(run.startedAt ?? run.finishedAt)}</strong><span>{run.source}</span><span className="ajm-run-count">{number(m.accepted)} 辆 · {number(run.durationSeconds == null ? null : Math.round(run.durationSeconds / 60))} 分钟</span></summary>
    <div className="ajm-run-body">
      {run.error && <p role="alert" className="ajm-alert danger">{run.error}</p>}
      <dl className="ajm-run-stats">{counts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{number(value)}</dd></div>)}</dl>
      <button type="button" className="ajm-button" disabled={pending} aria-expanded={open} onClick={()=>void showChanges()}>{pending?'读取详情…':open?'收起更新详情':'查看更新详情'}</button>
      {open && <div className="ajm-change-list">
        {m.rotationCursor && <p>目录位置：第 {m.rotationCursor.cycle ?? 1} 轮 · {m.rotationCursor.make} / {m.rotationCursor.model} · 第 {m.rotationCursor.page ?? 1} 页</p>}
        {m.checkpointAt && <p>云端断点：{date(m.checkpointAt)} · 恢复未入库车辆 {number(m.restoredVehicles)} 辆</p>}
        <p>跳过缺名链接 {number(m.malformedDetailLinks ?? 0)} 条 · 暂跳异常目录 {number(m.deferredGroups ?? 0)} 个</p>
        {m.publishError && <p>入库错误：{m.publishError} · 重试 {m.publishRetries ?? 0} 次</p>}
        {m.stopReason && <p>结束原因：{m.stopReason}</p>}
        {error && <p role="alert">{error}</p>}
        {changes && <><p>共 {number(changes.length)} 辆发生变更，以下为本次运行时记录的值。</p>
          {changes.slice((changePage-1)*20,changePage*20).map(v=><article className="ajm-change-item" key={v.id}>
            <strong>{v.kind==='added'?'新增':'更新'} · {v.name}</strong> <Link to={`/japan-market/${encodeURIComponent(v.id)}`} target="_blank">查看车辆</Link>
            <small>{v.stockNumber}</small>
            <ul>{v.changes.map(c=><li key={c.field}>{fields[c.field] ?? c.field}：{value(c.before)} → {value(c.after)}</li>)}</ul>
            <p>照片链接：新增 {v.addedPhotos.length} 张，移除 {v.removedPhotos.length} 张</p>
          </article>)}
          {changes.length>20 && <div className="ajm-pagination"><button className="ajm-button" disabled={changePage===1} onClick={()=>setChangePage(p=>p-1)}>上一页</button><span>{changePage} / {Math.ceil(changes.length/20)}</span><button className="ajm-button" disabled={changePage*20>=changes.length} onClick={()=>setChangePage(p=>p+1)}>下一页</button></div>}
        </>}
      </div>}
      <p>结束于 {date(run.finishedAt)} · {m.published ? '车源文件已生成' : '未发布新车源'} · {run.trigger === 'schedule' ? '每日定时' : run.trigger === 'workflow_dispatch' ? '手动执行' : '本地执行'}</p>
      {Object.entries(m.rejectionReasons ?? {}).length > 0 && <p>{Object.entries(m.rejectionReasons ?? {}).map(([key,value])=>`${reasons[key] ?? key} ${number(value)}`).join(' · ')}</p>}
      <p>增量合并保留旧库存；以上为运行结束后发布的记录。</p>
      {run.workflowUrl?.startsWith('https://github.com/') && <a href={run.workflowUrl} target="_blank" rel="noreferrer">查看此次执行日志 <ArrowUpRight size={15}/></a>}
    </div>
  </details>;
}

export function AdminJapanMarket() {
  const [report,setReport]=useState<CollectionReport|null>(null);
  const [vehicles,setVehicles]=useState<JapanMarketVehicleSummary[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const [tab,setTab]=useState<'overview'|'inventory'|'history'>('overview');
  const [scanning,setScanning]=useState(false);
  const [scanMessage,setScanMessage]=useState('');
  const [onlineDetails,setOnlineDetails]=useState(false);
  const [scanUrl,setScanUrl]=useState(WORKFLOW);
  const scan=async()=>{
    if(scanning)return;
    setScanning(true);setScanMessage('');setOnlineDetails(true);
    try {
      const result=await invokeAdminFunction<{started:boolean;message:string;workflowUrl:string}>('japan-market-scan',{});
      setScanMessage(result.message);
      if(result.workflowUrl?.startsWith('https://github.com/Chi1111111/innogroup-site/'))setScanUrl(result.workflowUrl);
    } catch(e) {setScanMessage(e instanceof Error?e.message:'扫描启动失败，请重试。');}
    finally {setScanning(false);}
  };
  const [query,setQuery]=useState('');
  const [quality,setQuality]=useState('all');
  const [sort,setSort]=useState('newest');
  const [page,setPage]=useState(1);
  useEffect(()=>{
    let active=true; setLoading(true); setError('');
    Promise.all([loadCollectionReport(),loadJapanMarketInventory()]).then(([next,inventory])=>{
      if(active) {setReport(next);setVehicles(inventory.vehicles);}
    }).catch((e:unknown)=>{if(active)setError(e instanceof Error ? e.message : '读取失败，请重试。');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[revision]);
  const filtered=useMemo(()=>vehicles.filter(v=>{
    if(quality==='price' && v.fobPriceNzd!=null)return false;
    if(quality==='photos' && (v.photoCount ?? 0)>1)return false;
    if(quality==='ready' && (v.fobPriceNzd==null || !(v.photoCount ?? 0)))return false;
    return `${v.id} ${v.stockNumber ?? ''} ${v.make} ${v.model} ${v.variant} ${v.year}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a,b)=>{
    if(sort==='original')return 0;
    const timestamp=(v:JapanMarketVehicleSummary)=>{
      const checked=Date.parse(v.priceCheckedAt ?? '');
      const updated=Date.parse(v.updatedAt);
      return Number.isFinite(checked)?checked:Number.isFinite(updated)?updated:null;
    };
    const first=timestamp(a),second=timestamp(b);
    if(first===null)return second===null?0:1;
    if(second===null)return -1;
    return sort==='newest'?second-first:first-second;
  }),[vehicles,query,quality,sort]);
  const priced=vehicles.filter(v=>v.fobPriceNzd!=null).length;
  const photographed=vehicles.filter(v=>(v.photoCount ?? 0)>0).length;
  const photos=vehicles.reduce((n,v)=>n+(v.photoCount ?? 0),0);
  const target=report?.target ?? 5000;
  const latest=report?.runs[0];
  const stale=!!report && Date.now()-Date.parse(report.refreshedAt)>36*3600000;
  const pages=Math.max(1,Math.ceil(filtered.length/25));
  const currentPage=Math.min(page,pages);
  const selectQuality=(value:string)=>{setQuality(value);setPage(1);setTab('inventory');};
  const exportCsv=()=>{
    const cell=(s:unknown)=>`"${String(s ?? '').replace(/^[=+@-]/,"'$&").replaceAll('"','""')}"`;
    const rows=[['Stock','Make','Model','Year','Mileage km','FOB NZD','Source price type','Photos','Price checked','Source URL'],...filtered.map(v=>[v.stockNumber ?? v.id,v.make,v.model,v.year,v.mileage,v.fobPriceNzd ?? 'On request',v.sourcePriceType,v.photoCount,v.priceCheckedAt,v.sourceUrl])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='japan-market-fob.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const stats: [string,string,string,LucideIcon][]=[['已发布车源',number(vehicles.length),`目标 ${number(target)} 辆`,CarFront],['FOB 报价',number(priced),`${number(vehicles.length-priced)} 辆报价待确认`,Check],['有照片车源',number(photographed),`共 ${number(photos)} 张源站照片`,Images],['最近更新',date(report?.refreshedAt),'新西兰时间 · 已发布快照',Clock3]];
  const pipeline: [string,number|null|undefined,string][]=[['读取库存',latest?.metrics.pagesFetched,'页'],['核对详情',latest?.metrics.detailSucceeded,'辆'],['FOB 报价',latest?.metrics.withFobPrice,'辆'],['相册照片',latest?.metrics.photoCount,'张']];
  return <main className="ajm">
    <nav className="admin-market-tabs" aria-label="采集管理导航">{([['overview','采集总览',LayoutDashboard],['inventory','车源与报价',CarFront],['history','运行记录',Clock3]] as const).map(([id,label,Icon])=><button type="button" key={id} className={tab===id?'active':''} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon size={19}/>{label}{id==='inventory' && report && <small>{number(vehicles.length)}</small>}</button>)}</nav>
    <div className="ajm-main">
      <header className="ajm-header"><div><p className="ajm-eyebrow">INVENTORY OPERATIONS</p><h1>{tab==='overview'?'Japan Market 采集中心':tab==='inventory'?'车源与 FOB 报价':'采集运行记录'}</h1><p>增量采集 · 每次最多 {number(target)} 辆 · 保留现有库存</p></div>
        <div className="ajm-actions"><button className="ajm-button" type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)}><RefreshCw size={16} className={loading?'ajm-spin':''}/>{loading?'读取中…':'刷新记录'}</button><button className="ajm-button primary" type="button" disabled onClick={()=>void scan()}><RefreshCw size={16} className={scanning?'ajm-spin':''}/>线上采集已停用</button><button className="ajm-button" type="button" aria-expanded={onlineDetails} aria-controls="online-scan-details" onClick={()=>setOnlineDetails(v=>!v)}>详情</button></div>
      </header>
      {onlineDetails && <section id="online-scan-details" className="ajm-panel" aria-label="线上扫描详情">
        <h2>线上扫描详情</h2>
        <p>线上采集已停用。以后新增车源使用本地采集；图片处理在独立云端队列运行。</p>
        <div className="ajm-actions"><a className="ajm-button" href={scanUrl} target="_blank" rel="noreferrer">查看线上任务与实时日志</a><button className="ajm-button" type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)}>刷新线上详情</button></div>
        <p>运行中的进度查看上方日志；以下为已发布的线上采集结果，包含新增车辆、照片变更及停止原因。</p>
        {report?.runs.some(run=>run.trigger==='schedule' || run.trigger==='workflow_dispatch') ? report.runs.filter(run=>run.trigger==='schedule' || run.trigger==='workflow_dispatch').slice(0,5).map((run,index)=><RunDetails key={run.id} run={run} initiallyOpen={index===0}/>) : <p>尚无已发布的线上扫描记录。任务结束并发布后，点击“刷新线上详情”查看。</p>}
      </section>}
      <LocalJapanMarketRunner/>
      {scanMessage && <p role="status" className="ajm-alert warning">{scanMessage} <a href={scanUrl} target="_blank" rel="noreferrer">查看任务进度</a></p>}
      {error && <p role="alert" className="ajm-alert danger">{error}{report ? ' 当前仍显示上次读取的数据。' : ''}</p>}
      {loading && !report && <div role="status" className="ajm-empty">正在读取车源和采集记录…</div>}
      {report && <>
        {stale && <p role="alert" className="ajm-alert warning">车源快照超过 36 小时未更新。请检查采集运行和网站发布结果。</p>}
        {report.source !== 'Japan Cars' && <p className="ajm-alert warning">来源接入待完成：Japan Cars 公开访问存在次数限制，尚未验证每天 5,000 辆的持续采集。当前保留旧来源快照，旧落地价不会作为 FOB 显示。</p>}
        {tab==='overview' && <>
          <section className="ajm-stats" aria-label="当前库存统计">{stats.map(([label,value,caption,Icon])=><article className="ajm-stat" key={label}><p><span>{label}</span><Icon size={18}/></p><strong className={label==='最近更新'?'ajm-stat-date':''}>{value}</strong><span>{caption}</span></article>)}</section>
          <div className="ajm-overview-grid">
            <section className="ajm-panel"><div className="ajm-panel-heading"><div><h2>最近一次采集</h2><p>{latest ? date(latest.startedAt ?? latest.finishedAt) : '首次运行后显示真实记录'}</p></div><Status run={latest}/></div>
              <div className="ajm-pipeline">{pipeline.map(([label,value,unit],i)=><div key={label}><span className="ajm-step">0{i+1}</span><p>{label}</p><strong>{number(value)} <small>{unit}</small></strong></div>)}</div>
              {latest?.error && <p role="alert" className="ajm-alert danger">{latest.error}</p>}
              <div className="ajm-panel-footer"><span>{latest?.source ?? 'Japan Cars'} · {latest?.metrics.published?'已生成车源快照':'等待成功生成快照'}</span><button type="button" onClick={()=>setTab('history')}>查看运行记录 <ArrowUpRight size={15}/></button></div>
            </section>
            <section className="ajm-panel"><div className="ajm-panel-heading"><div><h2>需要关注</h2><p>直接筛选出待核对的车辆</p></div></div>
              <button className="ajm-quality-row" type="button" onClick={()=>selectQuality('price')}><span>FOB 报价待确认<small>源站未公开可用车辆价格</small></span><strong>{number(vehicles.length-priced)}</strong><ArrowUpRight size={17}/></button>
              <button className="ajm-quality-row" type="button" onClick={()=>selectQuality('photos')}><span>相册待补充<small>当前只有一张或没有照片</small></span><strong>{number(vehicles.filter(v=>(v.photoCount ?? 0)<=1).length)}</strong><ArrowUpRight size={17}/></button>
              <button className="ajm-quality-row" type="button" onClick={()=>selectQuality('ready')}><span>报价与照片齐全<small>可浏览的已采集车源</small></span><strong>{number(vehicles.filter(v=>v.fobPriceNzd!=null && (v.photoCount ?? 0)>0).length)}</strong><ArrowUpRight size={17}/></button>
            </section>
          </div>
          <section className="ajm-panel ajm-policy"><div><p className="ajm-eyebrow">COLLECTION POLICY</p><h2>每日采集配置，异常保留旧数据</h2></div><dl><div><dt>计划时间</dt><dd>每天 00:00 · 新西兰时间</dd></div><div><dt>发布条件</dt><dd>验证通过即合并，旧库存保留</dd></div><div><dt>价格口径</dt><dd>FOB · NZD，进口费用另计</dd></div><div><dt>照片方式</dt><dd>保存源站完整相册链接</dd></div></dl></section>
        </>}
        {tab==='inventory' && <section className="ajm-panel ajm-inventory">
          <div className="ajm-inventory-tools"><label className="ajm-search"><Search size={18}/><input aria-label="搜索车源" placeholder="搜索品牌、车型、库存编号…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><select aria-label="车源完整度" value={quality} onChange={e=>{setQuality(e.target.value);setPage(1);}}><option value="all">全部车源</option><option value="ready">报价与照片齐全</option><option value="price">FOB 待确认</option><option value="photos">相册待补充</option></select><select aria-label="车源排序" title="按报价核对时间排序，缺失时使用车源更新时间" value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="newest">从新到旧</option><option value="oldest">从旧到新</option><option value="original">原始顺序</option></select><button className="ajm-button" type="button" onClick={exportCsv}><Download size={16}/>导出 {number(filtered.length)} 辆</button></div>
          <div className="ajm-table-scroll"><table><thead><tr><th>车辆 / 库存编号</th><th>年份 / 里程</th><th>FOB · NZD</th><th>相册</th><th>报价核对时间</th><th>查看</th></tr></thead><tbody>{filtered.slice((currentPage-1)*25,currentPage*25).map(v=><tr key={v.id}><td><div className="ajm-vehicle">{v.imageUrl ? <img src={v.imageUrl} alt={`${v.make} ${v.model}`} loading="lazy" referrerPolicy="no-referrer"/> : <CarFront size={28}/>}<div><strong>{v.make} {v.model}</strong><small>{v.stockNumber ?? v.id}</small></div></div></td><td>{v.year}<small>{number(v.mileage)} km</small></td><td><strong className={v.fobPriceNzd==null?'ajm-pending':''}>{v.fobPriceNzd==null?'待确认':formatNzd(v.fobPriceNzd)}</strong><small>原类型：{v.sourcePriceType ?? '未记录'}</small></td><td><Images size={15}/> {number(v.photoCount ?? 0)}</td><td>{date(v.priceCheckedAt)}</td><td><Link to={japanMarketVehiclePath(v)} target="_blank" aria-label={`查看 ${v.stockNumber ?? v.id}`}><ArrowUpRight size={19}/></Link></td></tr>)}</tbody></table></div>
          {!filtered.length && <p className="ajm-empty">没有符合当前条件的车源。</p>}
          <div className="ajm-pagination"><span>共 {number(filtered.length)} 辆 · 第 {currentPage} / {pages} 页</span><div><button className="ajm-button" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>上一页</button><button className="ajm-button" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>下一页</button></div></div>
        </section>}
        {tab==='history' && <section className="ajm-history"><p>最近保留 90 次运行记录。时间均为新西兰时间；记录随网站发布更新。</p>{report.runs.map(run=><RunDetails key={run.id} run={run}/>)}{!report.runs.length && <div className="ajm-empty">尚无采集详情。首次采集完成并发布后显示。</div>}</section>}
      </>}
      <footer className="ajm-footer"><span>这里显示已发布快照，并非实时进度。线上扫描直接提交 GitHub 任务；每日新西兰时间 00:00 自动扫描，调度可能有延迟。</span><Link to="/japan-market" target="_blank">查看 Japan Market <ArrowUpRight size={15}/></Link></footer>
    </div>
  </main>;
}
