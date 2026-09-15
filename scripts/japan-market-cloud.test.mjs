import { expect,it } from 'vitest';
import { openCloudInventory } from './lib/japan-market-cloud.mjs';
import { vehicleChanges } from './lib/japan-market-changes.mjs';
it('records price and photo differences without treating a check timestamp as an update',()=>{
  const old={id:'a',make:'Toyota',model:'Tank',year:2020,fobPriceNzd:100,photoCount:1,imageUrls:['a']};
  expect(vehicleChanges([old],[{...old,priceCheckedAt:'today'}])).toEqual([]);
  const changes=vehicleChanges([old],[{...old,fobPriceNzd:200,imageUrls:['b']}]);
  expect(changes[0]).toMatchObject({kind:'updated',addedPhotos:['b'],removedPhotos:['a'],changes:[{field:'fobPriceNzd',before:100,after:200}]});
  expect(vehicleChanges([],[old])[0].kind).toBe('added');
});
it('publishes memory payloads without force-pushing, and rejects concurrent cloud changes',async()=>{
  let head='initial';const writes=[];
  const request=async(url,options)=>{
    const endpoint=url.split('/innogroup-site/')[1];let body={};
    if(options.method!=='GET'){writes.push({endpoint,body:JSON.parse(options.body)});body={sha:'next'};}
    else if(endpoint==='git/ref/heads/main')body={object:{sha:head}};
    else if(endpoint.startsWith('git/commits/'))body={tree:{sha:head==='initial'?'tree':head}};
    else if(endpoint.startsWith('git/trees/'))body={tree:[{path:'src/code.ts',sha:head},{path:'public/data/japan-market/index.json',sha:head==='someone-else'?'changed-index':'index'},{path:'public/data/japan-market/details/000.json',sha:'detail'}]};
    else body={content:Buffer.from(JSON.stringify({vehicles:[{id:'a'}]})).toString('base64')};
    return {ok:true,json:async()=>body};
  };
  const cloud=await openCloudInventory({token:'test',request});
  expect(await cloud.details()).toEqual([{id:'a'}]);
  await cloud.publish(new Map([['index.json',{vehicles:[{id:'a'}]}]]));
  expect(writes.at(-1)).toMatchObject({endpoint:'git/refs/heads/main',body:{force:false}});
  head='code-only';
  await cloud.publish(new Map([['index.json',{vehicles:[{id:'a'}]}]]));
  expect(writes.at(-3)).toMatchObject({endpoint:'git/trees',body:{base_tree:'code-only'}});
  expect(writes.at(-2)).toMatchObject({endpoint:'git/commits',body:{parents:['code-only']}});
  const count=writes.length;head='someone-else';
  await expect(cloud.publish(new Map())).rejects.toThrow('changed during scan');
  expect(writes.length).toBe(count);
});
