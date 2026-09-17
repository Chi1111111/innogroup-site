import {it,expect} from 'vitest';
import {retryCloudRead,retryPublication} from './lib/japan-market-retry.mjs';
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
