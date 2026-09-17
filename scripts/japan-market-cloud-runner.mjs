import { fileURLToPath } from 'node:url';
import { createLocalService } from './japan-market-local-service.mjs';
// GitHub and desktop use the same batch controller and memory-only collector.
export async function runCloudCollection({service=createLocalService({maxDurationMs:19800000}), pollMs=2000}={}) {
const {server,token} = service;
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin=`http://127.0.0.1:${server.address().port}`;
const call=async(path,method='GET')=>{
 const response=await fetch(`${origin}/${path}`,{method,headers:{Origin:'https://www.innogroup.co.nz',Authorization:`Bearer ${token}`}});
 if(!response.ok)throw new Error(`Collector controller HTTP ${response.status}`);
 return response.json();
};
try {
 let status=await call('scan','POST');
 while(status.status==='running'){
  await new Promise(resolve=>setTimeout(resolve,pollMs));
  status=await call('status');
 }
 console.log(JSON.stringify({status:status.status,totalAdded:status.metrics?.totalAdded,message:status.message}));
 return status;
} finally {server.close();}

}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const status=await runCloudCollection();
 if(status.status==='failed')process.exitCode=1;
}
