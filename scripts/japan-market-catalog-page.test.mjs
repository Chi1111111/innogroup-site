import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { expect,it } from 'vitest';
const exports={};
const code=ts.transpileModule(readFileSync(new URL('../supabase/functions/_shared/japan-market-catalog.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(code,{exports,Date,Set,Map});
it('bounds page requests and rejects arbitrary filters and ordering',()=>{
  const result=exports.catalogFilters({page:Infinity,sort:'drop table',fuels:['Diesel','bad','Diesel'],bodies:{bad:true},yearFrom:'2025',yearTo:'2020',price:'20to30'});
  expect(result).toMatchObject({page:1,sort:'recommended',fuels:['Diesel'],bodies:[],yearFrom:2020,yearTo:2025,minPrice:20000,maxPrice:30000});
});
it('returns a zero-count page without making any image requests',async()=>{
  const client={rpc:async()=>({data:{rows:[],count:0,page:1,facets:[]},error:null})};
  expect(await exports.catalogPage(client,{})).toMatchObject({count:0,vehicles:[],page:1});
});
