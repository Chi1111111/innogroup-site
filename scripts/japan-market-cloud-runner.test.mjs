import {it,expect} from 'vitest';
import {EventEmitter} from 'node:events';
import {createLocalService} from './japan-market-local-service.mjs';
import {runCloudCollection} from './japan-market-cloud-runner.mjs';
it.each([true,false])('uses the shared authenticated controller and reports upload/failure (%s)',async success=>{
 const service=createLocalService({launch:()=>{
  const child=new EventEmitter();
  setTimeout(()=>{child.emit('message',{type:'progress',metrics:{published:success,added:success?5:0,sourceAccessBlocked:!success}});child.emit('close',success?0:1);},10);
  return child;
 }});
 const result=await runCloudCollection({service,pollMs:5});
 expect(result.status).toBe(success?'finished':'failed');
 expect(result.metrics.totalAdded).toBe(success?5:0);
});
