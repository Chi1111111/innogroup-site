import {it,expect} from 'vitest';
import {retryCloudRead,retryPublication,createCheckpointGate} from './lib/japan-market-retry.mjs';
it('retries transient reads and succeeds without an unbounded loop',async()=>{
 let calls=0;const delays=[];
 const value=await retryCloudRead(()=>{if(++calls<3)throw Object.assign(new Error('server unavailable'),{status:503});return 7;},{sleep:async n=>delays.push(n)});
 expect(value).toBe(7);expect(calls).toBe(3);expect(delays).toEqual([1000,3000]);
});
it('stops on permission failures and long rate-limit waits',async()=>{
 for(const error of [Object.assign(new Error('forbidden'),{status:403}),Object.assign(new Error('quota'),{status:429,retryAfterMs:3600000})]){
  let calls=0;await expect(retryCloudRead(()=>{calls++;throw error;},{sleep:async()=>{throw new Error('unexpected wait');}})).rejects.toBe(error);expect(calls).toBe(1);
 }
});
it('bounds publication retries and exposes the attempt for fresh inventory merge',async()=>{
 const attempts=[],delays=[];
 await expect(retryPublication(attempt=>{attempts.push(attempt);throw Object.assign(new Error('inventory changed'),{code:'INVENTORY_CHANGED'});},{sleep:async n=>delays.push(n)})).rejects.toThrow('inventory changed');
 expect(attempts).toEqual([0,1,2]);expect(delays).toEqual([5000,15000]);
});
it('does not retry a genuine checkpoint conflict as an upload',async()=>{
 let calls=0;await expect(retryPublication(()=>{calls++;throw Object.assign(new Error('conflict'),{code:'CHECKPOINT_CONFLICT'});})).rejects.toThrow('conflict');expect(calls).toBe(1);
});

it('coalesces frequent checkpoints and always flushes on batch completion',async()=>{
 let now=0,calls=0;const gate=createCheckpointGate({now:()=>now});const save=async()=>{calls++;};
 await gate(save);for(now=1000;now<60000;now+=1000)await gate(save);
 expect(calls).toBe(1);await gate(save);expect(calls).toBe(2);
 await gate(save,true);expect(calls).toBe(3);
});
it('a failed checkpoint does not suppress the next save',async()=>{
 const gate=createCheckpointGate({now:()=>0});await expect(gate(async()=>{throw new Error('network');})).rejects.toThrow('network');
 let saved=false;await gate(async()=>{saved=true;});expect(saved).toBe(true);
});
