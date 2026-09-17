import { createHash } from 'node:crypto';
// Separate cloud branch: checkpoints never change deployed inventory or store credentials.
const branch = 'japan-market-resume';
const filename = 'checkpoint.json';
export async function openResumeStore(api) {
  let ref;
  try { ref = await api(`git/ref/heads/${branch}`); }
  catch (error) { if (error.status !== 404) throw error; }
  let snapshot = {version:1,cursor:{},pending:[]};
  let sha;
  if (!ref) {
    const tree = await api('git/trees','POST',{tree:[{path:filename,mode:'100644',type:'blob',content:JSON.stringify(snapshot)},{path:'vercel.json',mode:'100644',type:'blob',content:JSON.stringify({git:{deploymentEnabled:false}})}]});
    const commit = await api('git/commits','POST',{message:'Initialize collector recovery checkpoint',tree:tree.sha,parents:[]});
    await api('git/refs','POST',{ref:`refs/heads/${branch}`,sha:commit.sha});
    ref = {object:{sha:commit.sha}};
  }
  const commit = await api(`git/commits/${ref.object.sha}`);
  const tree = await api(`git/trees/${commit.tree.sha}?recursive=1`);
  if (tree.truncated) throw new Error('Incomplete cloud checkpoint tree.');
  sha = tree.tree.find(v=>v.path===filename)?.sha;
  if (!sha) throw new Error('Cloud checkpoint missing; refusing to restart from the beginning.');
  const blob = await api(`git/blobs/${sha}`);
  snapshot = JSON.parse(Buffer.from(blob.content,'base64').toString('utf8'));
  if (snapshot.version !== 1 || !snapshot.cursor || !Array.isArray(snapshot.pending)) throw new Error('Invalid cloud checkpoint.');
  const fileFor = id => `pending/${createHash('sha256').update(id).digest('hex')}.json`;
  const contents = new Map();
  // Each pending vehicle has its own blob; don't duplicate all galleries on every save.
  for (let i=0;i<snapshot.pending.length;i+=4) {
    await Promise.all(snapshot.pending.slice(i,i+4).map(async (value,offset)=>{
      if (typeof value !== 'string') return; // Accept the original inline checkpoint format.
      const entry = tree.tree.find(v=>v.path===fileFor(value));
      if (!entry) throw new Error('Incomplete cloud checkpoint vehicle.');
      const record = await api(`git/blobs/${entry.sha}`);
      const text = Buffer.from(record.content,'base64').toString('utf8');
      const vehicle = JSON.parse(text);
      if (vehicle.id !== value) throw new Error('Invalid cloud checkpoint vehicle identity.');
      contents.set(fileFor(value),text);
      snapshot.pending[i+offset] = vehicle;
    }));
  }
  let head = ref.object.sha;
  let treeSha = commit.tree.sha;
  const ownHeads = new Set([head]);
  return {snapshot, async save(value) {
    const next = {version:1,...value,savedAt:new Date().toISOString()};
    const current = (await api(`git/ref/heads/${branch}`)).object.sha;
    // GitHub ref reads can lag a just-completed write. An older head produced by
    // this writer is safe to ignore: the final non-force PATCH still rejects races.
    if (current !== head && !ownHeads.has(current)) throw Object.assign(new Error(`Cloud checkpoint changed by another task; stopped to preserve its progress (expected ${head.slice(0,8)}, received ${current.slice(0,8)}).`), {code:'CHECKPOINT_CONFLICT'});
    const updated = new Map(next.pending.map(v=>[fileFor(v.id),JSON.stringify(v)]));
    const entries = [...updated].filter(([name,text])=>contents.get(name)!==text).map(([path,content])=>({path,mode:'100644',type:'blob',content}));
    for (const name of contents.keys()) if (!updated.has(name)) entries.push({path:name,mode:'100644',type:'blob',sha:null});
    entries.push({path:filename,mode:'100644',type:'blob',content:JSON.stringify({...next,pending:next.pending.map(v=>v.id)})});
    const nextTree = await api('git/trees','POST',{base_tree:treeSha,tree:entries});
    const nextCommit = await api('git/commits','POST',{message:'Save collector recovery position',tree:nextTree.sha,parents:[head]});
    await api(`git/refs/heads/${branch}`,'PATCH',{sha:nextCommit.sha,force:false});
    head = nextCommit.sha; ownHeads.add(head); treeSha = nextTree.sha;
    contents.clear(); for (const [name,text] of updated) contents.set(name,text);
    return next.savedAt;
  }};
}
export function restorePending(snapshot, existing) {
  const ids = new Set(existing.map(v=>v.id));
  return snapshot.pending.filter(v=>{if(!v?.id || ids.has(v.id))return false;ids.add(v.id);return true;});
}
