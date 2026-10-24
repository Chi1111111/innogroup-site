import type { ReactNode } from 'react';

export function MotionCollapse({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  return <div id={id} className="motion-collapse" data-open={open} aria-hidden={!open} ref={(node) => { node?.toggleAttribute('inert', !open); }}>
    <div>{children}</div>
  </div>;
}
