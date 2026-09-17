import { retryCloudRead } from './japan-market-retry.mjs';
import { openResumeStore } from './japan-market-resume.mjs';
import { execFileSync } from 'node:child_process';

// Vehicle payloads and credentials stay in memory. No git checkout or temporary data files.
export async function openCloudInventory({token,request=fetch}={}) {
  token ||= process.env.GH_TOKEN || process.env.GITHUB_TOKEN || execFileSync('gh',['auth','token'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  const once=async (endpoint,method='GET',body)=>{
    const r=await request(`https://api.github.com/repos/Chi1111111/innogroup-site/${endpoint}`,{method,
      headers:{'Cache-Control':'no-cache',Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2026-03-10'},
      body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});
    if(!r.ok){
      let info={};try{info=await r.json();}catch{/* Some proxy errors have no JSON body. */}
      const detail=String(info.message || 'No response message').slice(0,500);
      const fields=Array.isArray(info.errors)?info.errors.map(e=>typeof e==='string'?e:[e.resource,e.field,e.code,e.message].filter(Boolean).join(':')).join('; ').slice(0,500):'';
      throw Object.assign(new Error(`Cloud inventory ${method} ${endpoint} failed (${r.status}): ${detail}${fields?`; ${fields}`:''}`),{status:r.status,retryAfterMs:Number(r.headers?.get('retry-after')||0)*1000,requestId:r.headers?.get('x-github-request-id')});
    }
    return r.json();
  };
  const api=(endpoint,method='GET',body)=>method==='GET' ? retryCloudRead(()=>once(endpoint,method,body)) : once(endpoint,method,body);
  const head=(await api('git/ref/heads/main')).object.sha;
  const commit=await api(`git/commits/${head}`);
  const tree=await api(`git/trees/${commit.tree.sha}?recursive=1`);
  if(tree.truncated)throw new Error('Cloud inventory tree incomplete.');
  const entries=new Map(tree.tree.map(v=>[v.path,v]));
  const memory=new Map();
  const read=async name=>{
    if(memory.has(name))return memory.get(name);
    const entry=entries.get(`public/data/japan-market/${name}`);
    if(!entry)throw new Error(`Cloud inventory file missing: ${name}`);
    const blob=await api(`git/blobs/${entry.sha}`);
    const value=JSON.parse(Buffer.from(blob.content,'base64').toString('utf8'));
    memory.set(name,value);return value;
  };
  const index=await read('index.json');
  if(!Array.isArray(index.vehicles))throw new Error('Invalid cloud inventory.');
  return {index,read, resume: () => openResumeStore(api),
    async details(){
      const names=[...entries.keys()].filter(p=>/^public\/data\/japan-market\/details\/\d+\.json$/.test(p)).map(p=>p.replace('public/data/japan-market/',''));
      const records=[];
      for(let i=0;i<names.length;i+=8)for(const p of await Promise.all(names.slice(i,i+8).map(read)))records.push(...p.vehicles);
      if(!index.vehicles.every(v=>records.some(r=>r.id===v.id)))throw new Error('Cloud detail snapshot is incomplete.');
      return records;
    },
    async publish(files){
      // Code-only deployments may advance main while scanning. Compare the entire
      // inventory subtree before rebasing onto the latest commit; never overwrite
      // another collector's inventory, galleries, or run history.
      const latestHead=(await api('git/ref/heads/main')).object.sha;
      let latestCommit=commit;
      if(latestHead!==head){
        latestCommit=await api(`git/commits/${latestHead}`);
        const latestTree=await api(`git/trees/${latestCommit.tree.sha}?recursive=1`);
        if(latestTree.truncated)throw new Error('Cloud inventory tree incomplete.');
        const inventoryEntries=items=>items.filter(v=>v.path.startsWith('public/data/japan-market/')).map(v=>`${v.path}:${v.sha}`).sort();
        if(JSON.stringify(inventoryEntries(tree.tree))!==JSON.stringify(inventoryEntries(latestTree.tree)))throw Object.assign(new Error('Cloud inventory changed during scan; refreshing before merge.'),{code:'INVENTORY_CHANGED'});
      }
      const nextTree=await api('git/trees','POST',{base_tree:latestCommit.tree.sha,tree:[...files].map(([name,value])=>({path:`public/data/japan-market/${name}`,mode:'100644',type:'blob',content:JSON.stringify(value)}))});
      const nextCommit=await api('git/commits','POST',{message:'Update Japan Market from memory-only local scan',tree:nextTree.sha,parents:[latestHead]});
      await api('git/refs/heads/main','PATCH',{sha:nextCommit.sha,force:false});
      return nextCommit.sha;
    }
  };
}
