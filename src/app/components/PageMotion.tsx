import { useEffect, useRef, type ReactNode } from 'react';

const revealSelector = '[data-reveal], .section-card, .section-card-dark, .jm-listing, section h2';

/** Progressive enhancement: content stays readable if motion is unavailable. */
export function PageMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches) continue;
        const animation = entry.target.animate(
          [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 560, delay: Math.min(order++ * 65, 195), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { threshold: 0.08 });

    const register = () => {
      container.querySelectorAll(revealSelector).forEach((element) => {
        // Avoid nested animations and leave the hero's own sequence in control.
        if (seen.has(element) || element.parentElement?.closest(revealSelector) || element.closest('.hero-motion')) return;
        seen.add(element);
        observer.observe(element);
      });
    };
    register();
    // Include asynchronously loaded vehicle cards without scroll handlers.
    const mutations = new MutationObserver(register);
    mutations.observe(container, { childList: true, subtree: true });
    const stopMotion = () => {
      if (preference.matches) animations.forEach((animation) => animation.cancel());
    };
    preference.addEventListener('change', stopMotion);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener('change', stopMotion);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return <div ref={root} className="page-motion">{children}</div>;
}
