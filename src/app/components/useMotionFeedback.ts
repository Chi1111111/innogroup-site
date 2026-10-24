import { useEffect, useRef } from 'react';
import { MOTION } from '../lib/siteMotion';

/** Update feedback without remounting inputs, changing focus, or interpolating prices. */
export function useMotionFeedback<T extends HTMLElement>(value: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element?.animate || preference.matches) return;
    const animation = element.animate([{ opacity: 0.65 }, { opacity: 1 }], { duration: MOTION.feedback, easing: MOTION.ease });
    const stop = () => { if (preference.matches) animation.cancel(); };
    preference.addEventListener('change', stop);
    return () => { animation.cancel(); preference.removeEventListener('change', stop); };
  }, [value]);
  return ref;
}
