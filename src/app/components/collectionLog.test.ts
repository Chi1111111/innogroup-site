import { expect, it } from 'vitest';
import { explainProblem, inLastDay, photoSteps } from './collectionLog';

it('only retains valid records from the rolling 24-hour window', () => {
  const now=Date.parse('2026-09-28T12:00:00Z');
  expect(inLastDay('2026-09-27T12:00:01Z',now)).toBe(true);
  expect(inLastDay('2026-09-27T12:00:00Z',now)).toBe(false);
  expect(inLastDay('2026-09-28T12:01:00Z',now)).toBe(false);
  expect(inLastDay('invalid',now)).toBe(false);
});
it('explains common failures without claiming an unobserved cause or retry', () => {
  expect(explainProblem('TimeoutError: The read operation timed out')).toContain('连接超时');
  expect(explainProblem('SOURCE_HTTP_429')).toContain('不要反复');
  expect(explainProblem('PHOTO_CAPACITY_LIMIT')).toContain('空间不足');
  expect(explainProblem('unrecognized')).toContain('原因暂时无法确定');
  expect(photoSteps.repair).toBe('正在去除水印');
});
