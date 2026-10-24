export const MOTION = {
  ease: 'cubic-bezier(.22, 1, .36, 1)', reveal: 420, feedback: 220, stagger: 45, maxDelay: 135,
} as const;

export const revealSelector = '[data-reveal], .motion-intro > *, .motion-stagger > *, .section-card, .section-card-dark, .jm-listing, .motion-card, .animate-slideUp, section h1, main h1, section h2';
const excludedSelector = '#import-journey, .hero-motion, [data-motion="off"], dialog, [role="dialog"], .motion-step';

/** No hidden baseline styles: failure or disabled motion leaves every element visible. */
export function observeReveals(container: HTMLElement) {
  if (!('IntersectionObserver' in window) || !('animate' in Element.prototype)) return () => {};
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 767px)');
  const seen = new WeakSet<Element>();
  const animations = new Map<Element, Animation>();
  const observer = new IntersectionObserver((entries) => {
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches || entry.target.contains(document.activeElement)) continue;
      // Only short copy moves; card hit areas and sticky parents stay fixed.
      const copy = entry.target.matches('h1, h2, p, .section-kicker');
      const frames: Keyframe[] = copy
        ? [{ opacity: 0.25, transform: `translateY(${compact.matches ? 6 : 12}px)` }, { opacity: 1, transform: 'translateY(0)' }]
        : [{ opacity: 0.25 }, { opacity: 1 }];
      const animation = entry.target.animate(frames, {
        duration: compact.matches ? 300 : MOTION.reveal,
        delay: Math.min(order++ * MOTION.stagger, MOTION.maxDelay),
        easing: MOTION.ease, fill: 'backwards',
      });
      animations.set(entry.target, animation);
      animation.onfinish = animation.oncancel = () => animations.delete(entry.target);
    }
  }, { threshold: 0.08 });

  const register = (element: Element) => {
    if (seen.has(element) || element.closest(excludedSelector)) return;
    const parent = element.parentElement?.closest(revealSelector);
    if (parent && container.contains(parent)) return;
    seen.add(element);
    observer.observe(element);
  };
  container.querySelectorAll(revealSelector).forEach(register);
  const mutations = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(revealSelector)) register(node);
      node.querySelectorAll(revealSelector).forEach(register);
    }
  });
  mutations.observe(container, { childList: true, subtree: true });

  const stopMotion = () => { if (preference.matches) animations.forEach((animation) => animation.cancel()); };
  const revealFocused = (event: FocusEvent) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target;
    animations.forEach((animation, element) => { if (element.contains(target)) animation.cancel(); });
  };
  preference.addEventListener('change', stopMotion);
  container.addEventListener('focusin', revealFocused);
  return () => {
    observer.disconnect();
    mutations.disconnect();
    preference.removeEventListener('change', stopMotion);
    container.removeEventListener('focusin', revealFocused);
    animations.forEach((animation) => animation.cancel());
  };
}
