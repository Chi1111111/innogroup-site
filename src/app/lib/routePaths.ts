const WORKFLOW_ROOTS = ['/admin', '/sign', '/contract'] as const;

export function isPathWithin(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function isWorkflowPath(pathname: string) {
  return WORKFLOW_ROOTS.some((root) => isPathWithin(pathname, root));
}
