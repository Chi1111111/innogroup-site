import { useEffect, useRef, type ImgHTMLAttributes } from 'react';
import { MOTION } from '../lib/siteMotion';

/** Animate only when the actual image is ready, without delaying selection or errors. */
export function MotionImage({ onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const animation = useRef<Animation | null>(null);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => { if (preference.matches) animation.current?.cancel(); };
    preference.addEventListener('change', stop);
    return () => { preference.removeEventListener('change', stop); animation.current?.cancel(); };
  }, []);
  return <img {...props} onLoad={(event) => {
    onLoad?.(event);
    animation.current?.cancel();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && event.currentTarget.animate) {
      animation.current = event.currentTarget.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 280, easing: MOTION.ease });
    }
  }} />;
}
