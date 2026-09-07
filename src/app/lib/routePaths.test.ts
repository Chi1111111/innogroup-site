import { describe, expect, it } from 'vitest';
import { isPathWithin, isWorkflowPath } from './routePaths';

describe('route path boundaries', () => {
  it('matches exact paths and child routes', () => {
    expect(isPathWithin('/admin', '/admin')).toBe(true);
    expect(isPathWithin('/admin/contracts', '/admin')).toBe(true);
  });

  it('does not match paths that only share a prefix', () => {
    expect(isPathWithin('/administrator', '/admin')).toBe(false);
    expect(isWorkflowPath('/contractor')).toBe(false);
  });

  it('recognizes all private workflow roots', () => {
    expect(isWorkflowPath('/admin/weekly-reports')).toBe(true);
    expect(isWorkflowPath('/sign/example')).toBe(true);
    expect(isWorkflowPath('/contract/example')).toBe(true);
  });
});
