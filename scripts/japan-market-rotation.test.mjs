import { expect, it } from 'vitest';
import { rotateGroups, readMakes, readModels, groupListingUrl } from './lib/japan-market-rotation.mjs';
it('uses maker for models and parses the actual public catalog formats',()=>{
  const url=new URL(groupListingUrl('https://www.japancars.co.jp','Toyota','Tank',2));
  expect(url.searchParams.get('maker')).toBe('Tank');expect(url.searchParams.has('model')).toBe(false);
  expect(readMakes({data:'<option value="">Select</option><option value="Toyota">Toyota</option><option value="Toyota">Toyota</option>'})).toEqual(['Toyota']);
  expect(readModels({data:[{value:'Tank'},{value:'Tank'},{value:''}]})).toEqual(['Tank']);
});
it('visits every combination before the next round and terminates after a round with no additions',async()=>{
  const turns=[];
  for await(const turn of rotateGroups({makes:['Toyota','Honda'],modelsFor:async make=>make==='Toyota'?['Tank','Vitz']:['Fit']})){
    turns.push([turn.cycle,turn.make,turn.model]);if(turn.cycle===1)turn.accepted=5;
  }
  expect(turns).toEqual([[1,'Toyota','Tank'],[1,'Toyota','Vitz'],[1,'Honda','Fit'],[2,'Toyota','Tank'],[2,'Toyota','Vitz'],[2,'Honda','Fit']]);
});
it('resumes the partially filled group across batches without granting it five extra slots',async()=>{
  const turns=[];
  for await(const turn of rotateGroups({makes:['Toyota','Honda'],modelsFor:async make=>make==='Toyota'?['Tank','Vitz']:['Fit'],cursor:{make:'Toyota',model:'Vitz',cycle:3,accepted:4}})){
    turns.push({...turn});
    if(turn.cycle===3 && turn.model==='Vitz')turn.accepted++;
  }
  expect(turns[0]).toEqual({make:'Toyota',model:'Vitz',cycle:3,accepted:4});
  expect(turns.map(v=>[v.cycle,v.model])).toEqual([[3,'Vitz'],[3,'Fit'],[4,'Tank'],[4,'Vitz'],[4,'Fit']]);
});
