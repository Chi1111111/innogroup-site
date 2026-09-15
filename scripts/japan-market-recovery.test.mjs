import { expect, it } from 'vitest';
import { createDetailRecovery } from './lib/japan-market-recovery.mjs';
const missing = () => Object.assign(new Error('missing'), {code:'VEHICLE_IDENTITY_MISMATCH',receivedStock:'Not listed'});
it('skips isolated failures, backs off on repeated missing details and resumes the same operation', async()=>{
  const waits=[];let calls=0;
  const recover=createDetailRecovery({deadline:10e9,now:()=>0,sleep:async ms=>waits.push(ms),onPause:()=>{},onResume:()=>{}});
  for(let i=0;i<2;i++)await expect(recover(async()=>{throw missing();})).rejects.toThrow('missing');
  const result=await recover(async()=>{calls++;if(calls<3)throw missing();return 'same vehicle';});
  expect(result).toBe('same vehicle');expect(waits).toEqual([900000,1800000]);
});
it('bounds recovery to three probes and never retries explicit blocks or mismatched vehicles',async()=>{
  const waits=[];
  const recover=createDetailRecovery({deadline:10e9,now:()=>0,sleep:async ms=>waits.push(ms),onPause:()=>{},onResume:()=>{}});
  for(let i=0;i<2;i++)await expect(recover(async()=>{throw missing();})).rejects.toThrow('missing');
  await expect(recover(async()=>{throw missing();})).rejects.toMatchObject({code:'DETAIL_RECOVERY_EXHAUSTED'});
  expect(waits).toEqual([900000,1800000,3600000]);
  for(const error of [new Error('HTTP 403'),Object.assign(missing(),{receivedStock:'another-car'})])await expect(recover(async()=>{throw error;})).rejects.toBe(error);
  expect(waits).toHaveLength(3);
});
it('does not wait beyond the collection deadline',async()=>{
  let waited=false;
  const recover=createDetailRecovery({deadline:100,now:()=>0,sleep:async()=>{waited=true;},onPause:()=>{},onResume:()=>{}});
  for(let i=0;i<2;i++)await expect(recover(async()=>{throw missing();})).rejects.toThrow();
  await expect(recover(async()=>{throw missing();})).rejects.toMatchObject({code:'DETAIL_RECOVERY_EXHAUSTED'});
  expect(waited).toBe(false);
});
