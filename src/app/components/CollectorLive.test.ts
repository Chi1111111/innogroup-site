import {expect,it} from 'vitest';
import {collectorLiveLabel,type CollectorSnapshot} from './CollectorLive';
const now=Date.parse('2026-09-28T01:00:00Z');
const sample:CollectorSnapshot={received_at:new Date(now).toISOString(),snapshot:{state:'running',message:'读取车辆',lastActionAt:new Date(now-1000).toISOString(),nextRunAt:null,events:[]}};
it('does not mistake old checkpoints, missing integration or stale heartbeats for running',()=>{
  expect(collectorLiveLabel(null,now)).toContain('尚未接入');
  expect(collectorLiveLabel(sample,now)).toContain('有新的进展');
  expect(collectorLiveLabel(sample,now+46000)).toContain('连接中断');
  expect(collectorLiveLabel({...sample,snapshot:{...sample.snapshot,lastActionAt:new Date(now-91000).toISOString()}},now)).toContain('进度已一段时间没变化');
  expect(collectorLiveLabel({...sample,snapshot:{...sample.snapshot,state:'paused'}},now)).toBe('采集已暂停');
});
