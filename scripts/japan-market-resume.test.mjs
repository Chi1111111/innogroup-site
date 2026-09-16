import {expect,it} from 'vitest';
import {openResumeStore,restorePending} from './lib/japan-market-resume.mjs';
function server(initial) {
 let head=initial?'initial':null, sequence=0;const writes=[], blobs=new Map(),trees=new Map(),commits=new Map();
 const blob=text=>{const sha='blob'+sequence++;blobs.set(sha,text);return sha;};
 if(initial){trees.set('first',[{path:'checkpoint.json',sha:blob(JSON.stringify(initial))}]);commits.set('initial',{tree:{sha:'first'}});}
 const api=async(path,method='GET',body)=>{
  if(method!=='GET')writes.push({path,body});
  if(path==='git/ref/heads/japan-market-resume'){if(!head)throw Object.assign(new Error('missing'),{status:404});return {object:{sha:head}};}
  if(path==='git/trees' && method==='POST'){
   const entries=new Map((trees.get(body.base_tree)||[]).map(v=>[v.path,v]));
   for(const v of body.tree){if(v.sha===null)entries.delete(v.path);else entries.set(v.path,{path:v.path,sha:blob(v.content)});}
   const sha='tree'+sequence++;trees.set(sha,[...entries.values()]);return {sha};
  }
  if(path==='git/commits' && method==='POST'){const sha='commit'+sequence++;commits.set(sha,{tree:{sha:body.tree},parents:body.parents});return {sha};}
  if(path==='git/refs'){head=body.sha;return {};}
  if(path.startsWith('git/commits/'))return commits.get(path.split('/').at(-1));
  if(path.startsWith('git/trees/'))return {tree:trees.get(path.split('/').at(-1).split('?')[0])};
  if(path.startsWith('git/blobs/'))return {content:Buffer.from(blobs.get(path.split('/').at(-1))).toString('base64')};
  if(path==='git/refs/heads/japan-market-resume'){
   expect(body.force).toBe(false);
   if(commits.get(body.sha).parents[0]!==head)throw new Error('concurrent conflict');
   head=body.sha;return {};
  }
  throw new Error(path);
 };
 return {api,writes};
}
it('restores a durable position and pending photos after a new process opens the store',async()=>{
 const s=server();const first=await openResumeStore(s.api);
 const cursor={make:'Toyota',model:'Tank',cycle:2,accepted:3,page:12};
 const pending=[{id:'a',imageUrls:['photo'],fobPriceNzd:123}];
 await first.save({cursor,pending,rates:{NZD:1.7,JPY:140}});
 const restarted=await openResumeStore(s.api);
 expect(restarted.snapshot).toMatchObject({cursor,pending,rates:{NZD:1.7,JPY:140}});
 expect(s.writes[0].body.tree[1]).toMatchObject({path:'vercel.json',content:'{"git":{"deploymentEnabled":false}}'});
 await restarted.save({...restarted.snapshot,cursor:{...cursor,page:13}});
 expect(s.writes.filter(w=>w.path==='git/trees').at(-1).body.tree).toHaveLength(1);
 expect(s.writes.every(w=>!w.path.includes('heads/main'))).toBe(true);
});
it('deduplicates a checkpoint left behind by a crash after inventory publication',()=>{
 const snapshot={pending:[{id:'a'},{id:'b'},{id:'b'}]};
 expect(restorePending(snapshot,[{id:'a'}])).toEqual([{id:'b'}]);
});
it('keeps position when acknowledging upload and rejects stale concurrent writers',async()=>{
 const s=server({version:1,cursor:{make:'Toyota'},pending:[{id:'a'}]});
 const a=await openResumeStore(s.api),b=await openResumeStore(s.api);
 await a.save({cursor:a.snapshot.cursor,pending:[]});
 await expect(b.save({cursor:{make:'Honda'},pending:[]})).rejects.toThrow('changed on another computer');
 const next=await openResumeStore(s.api);
 expect(next.snapshot.cursor).toEqual({make:'Toyota'});expect(next.snapshot.pending).toEqual([]);
});
it('fails closed for inaccessible or malformed checkpoints',async()=>{
 await expect(openResumeStore(async()=>{throw Object.assign(new Error('forbidden'),{status:403});})).rejects.toThrow('forbidden');
 const s=server({version:99,cursor:{},pending:[]});
 await expect(openResumeStore(s.api)).rejects.toThrow('Invalid');
});
