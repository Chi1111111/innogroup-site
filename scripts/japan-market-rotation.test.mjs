import { expect, it } from 'vitest';
import { rotateGroups, readMakes, readModels, groupListingUrl, matchesGroup, missingGroupAction, hasMissingModelSlug } from './lib/japan-market-rotation.mjs';
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
  for await(const turn of rotateGroups({makes:['Toyota','Honda'],modelsFor:async make=>make==='Toyota'?['Tank','Vitz']:['Fit'],cursor:{make:'Toyota',model:'Vitz',cycle:3,accepted:4,page:7}})){
    turns.push({...turn});
    if(turn.cycle===3 && turn.model==='Vitz')turn.accepted++;
  }
  expect(turns[0]).toEqual({make:'Toyota',model:'Vitz',cycle:3,accepted:4,page:7});
  expect(turns[1].page).toBe(1);
  expect(turns.map(v=>[v.cycle,v.model])).toEqual([[3,'Vitz'],[3,'Fit'],[4,'Tank'],[4,'Vitz'],[4,'Fit']]);
});

it('accepts catalog model families while rejecting other makes and partial-word matches',()=>{
 expect(matchesGroup({make:'BMW',model:'MINI COOPER 5DOOR'},{make:'BMW',model:'Cooper'})).toBe(true);
 expect(matchesGroup({make:'Toyota',model:'Tank'},{make:'Toyota',model:'Tank'})).toBe(true);
 expect(matchesGroup({make:'Audi',model:'A180'},{make:'Audi',model:'A1'})).toBe(false);
 expect(matchesGroup({make:'Toyota',model:'Cooper'},{make:'BMW',model:'Cooper'})).toBe(false);
 expect(matchesGroup({make:'BMW',model:'320i'},{make:'BMW',model:'Cooper'})).toBe(false);
 expect(matchesGroup({make:'BMW',model:'320i'},{make:'BMW',model:''})).toBe(false);
});

it('allows only one adjacent-group check for an entirely missing group',()=>{
 expect(missingGroupAction(2,2,0)).toBe('continue');
 expect(missingGroupAction(3,3,0)).toBe('defer');
 expect(missingGroupAction(4,1,0)).toBe('stop');
 expect(missingGroupAction(3,3,1)).toBe('stop');
 expect(missingGroupAction(3,1,0)).toBe('stop');
});
it('resumes after a deferred directory without counting it as five collected cars',async()=>{
 const turns=[];
 for await(const turn of rotateGroups({makes:['Chevrolet','Toyota'],modelsFor:async m=>m==='Chevrolet'?['Corvette']:['Tank'],cursor:{make:'Chevrolet',model:'Corvette',cycle:1,accepted:0,deferred:true}}))turns.push({...turn});
 expect(turns[0]).toMatchObject({make:'Toyota',model:'Tank',cycle:1,accepted:0});
 expect(turns[1]).toMatchObject({make:'Chevrolet',model:'Corvette',cycle:2,accepted:0});
});

it('skips consecutive empty-model Japanese links without excluding valid Japanese or English models',()=>{
 const row={sourceUrl:'https://www.japancars.co.jp/stock-detail/japanese-used-chevrolet--QVVDMjU3NjU0MTMyMDI2.html'};
 expect(hasMissingModelSlug(row,{model:'コルベット'})).toBe(true);
 expect(hasMissingModelSlug(row,{model:'シボレーコルベット'})).toBe(true);
 expect(hasMissingModelSlug({...row,sourceUrl:row.sourceUrl.replace('chevrolet--','chevrolet-corvette-')},{model:'コルベット'})).toBe(false);
 expect(hasMissingModelSlug(row,{model:'Corvette'})).toBe(false);
 expect(hasMissingModelSlug({sourceUrl:'invalid'},{model:'コルベット'})).toBe(false);
});

it('matches the verified Honda stepwgn alias in both directions without broad fuzzy matching',()=>{
 expect(matchesGroup({make:'Honda',model:'Stepwagon'},{make:'Honda',model:'stepwgn'})).toBe(true);
 expect(matchesGroup({make:'Honda',model:'STEPWGN SPADA'},{make:'Honda',model:'Stepwagon'})).toBe(true);
 expect(matchesGroup({make:'Honda',model:'Stepwagon'},{make:'Honda',model:'stepwgn 4wd'})).toBe(false);
 expect(matchesGroup({make:'Toyota',model:'Stepwagon'},{make:'Honda',model:'stepwgn'})).toBe(false);
 expect(matchesGroup({make:'Honda',model:'Fit'},{make:'Honda',model:'stepwgn'})).toBe(false);
});
