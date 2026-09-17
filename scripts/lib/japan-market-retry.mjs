export const transientCloudError = error => error?.status === 429 || error?.status >= 500 || ['TypeError','TimeoutError','AbortError'].includes(error?.name) || /fetch failed|ECONNRESET|ETIMEDOUT|socket/i.test(error?.message || '');
export async function retryCloudRead(action,{sleep=ms=>new Promise(r=>setTimeout(r,ms)),onRetry=()=>{}}={}) {
 for(let attempt=0;;attempt++)try{return await action();}catch(error){
  if(attempt>=2 || !transientCloudError(error))throw error;
  const delay=Math.max(1000*3**attempt,Number(error.retryAfterMs)||0);
  if(delay>60000)throw error;
  onRetry({attempt:attempt+1,delay,error});await sleep(delay);
 }
}
export async function retryPublication(action,{sleep=ms=>new Promise(r=>setTimeout(r,ms)),onRetry=()=>{}}={}) {
 for(let attempt=0;;attempt++)try{return await action(attempt);}catch(error){
  if(attempt>=2 || !(transientCloudError(error)||error?.code==='INVENTORY_CHANGED'))throw error;
  const delay=Math.max(5000*3**attempt,Number(error.retryAfterMs)||0);
  if(delay>60000)throw error;
  onRetry({attempt:attempt+1,delay,error});await sleep(delay);
 }
}
