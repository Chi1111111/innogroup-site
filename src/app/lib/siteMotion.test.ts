import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOTION, observeReveals, revealSelector } from './siteMotion';

class TestElement {
  parentElement: TestElement | null = null;
  children: TestElement[] = [];
  excluded = false;
  copy = false;
  reveal = true;
  querySelectorAll = vi.fn(() => this.children);
  listeners = new Map<string, (event: { target: TestElement }) => void>();
  animation = { cancel: vi.fn(), onfinish: null, oncancel: null };
  animate = vi.fn(() => this.animation);
  matches(selector: string) { return selector === revealSelector ? this.reveal : this.copy; }
  closest(selector: string): TestElement | null {
    return (selector === revealSelector ? this.reveal : this.excluded) ? this : this.parentElement?.closest(selector) ?? null;
  }
  contains(element: unknown) { return element === this || this.children.includes(element as TestElement); }
  addEventListener(name: string, fn: (event: { target: TestElement }) => void) { this.listeners.set(name, fn); }
  removeEventListener(name: string) { this.listeners.delete(name); }
}

let observed: Set<TestElement>;
let intersect: (entries: { target: TestElement; isIntersecting: boolean }[]) => void;
let mutated: (records: { addedNodes: TestElement[] }[]) => void;
let disconnectIntersection: ReturnType<typeof vi.fn>;
let disconnectMutation: ReturnType<typeof vi.fn>;
let preference: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
let compact: { matches: boolean };

beforeEach(() => {
  observed = new Set();
  disconnectIntersection = vi.fn();
  disconnectMutation = vi.fn();
  preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  compact = { matches: false };
  class Intersection {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe(element: TestElement) { observed.add(element); }
    unobserve(element: TestElement) { observed.delete(element); }
    disconnect = disconnectIntersection;
  }
  class Mutation {
    constructor(callback: typeof mutated) { mutated = callback; }
    observe() {}
    disconnect = disconnectMutation;
  }
  vi.stubGlobal('Element', TestElement);
  vi.stubGlobal('IntersectionObserver', Intersection);
  vi.stubGlobal('MutationObserver', Mutation);
  vi.stubGlobal('document', { activeElement: null });
  vi.stubGlobal('window', { IntersectionObserver: Intersection, matchMedia: (query: string) => query.includes('reduce') ? preference : compact });
  // The API exists on real Element.prototype; the spy lives on each test element.
  Object.defineProperty(TestElement.prototype, 'animate', { value: () => {}, configurable: true });
});
afterEach(() => vi.unstubAllGlobals());

function setup(...children: TestElement[]) {
  const container = new TestElement();
  container.reveal = false;
  container.children = children;
  children.forEach((child) => { child.parentElement = container; });
  const cleanup = observeReveals(container as unknown as HTMLElement);
  const enter = () => intersect([...observed].map((target) => ({ target, isIntersecting: true })));
  return { container, cleanup, enter };
}

describe('shared viewport motion', () => {
  it('keeps interactive card hit areas fixed and bounds stagger delays', () => {
    const cards = Array.from({ length: 12 }, () => new TestElement());
    const { enter } = setup(...cards);
    enter(); enter();
    cards.forEach((card) => {
      expect(card.animate).toHaveBeenCalledTimes(1);
      const [frames, options] = card.animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
      expect(frames.every((frame) => frame.transform === undefined)).toBe(true);
      expect(options.delay).toBeLessThanOrEqual(MOTION.maxDelay);
    });
  });

  it('leaves reduced-motion content visible without playing later on preference change', () => {
    preference.matches = true;
    const card = new TestElement();
    const { enter } = setup(card);
    enter(); preference.matches = false; enter();
    expect(card.animate).not.toHaveBeenCalled();
  });

  it('uses smaller movement and shorter duration on phones', () => {
    compact.matches = true;
    const title = new TestElement(); title.copy = true;
    setup(title).enter();
    expect(title.animate).toHaveBeenCalledWith(
      [{ opacity: 0.25, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
      expect.objectContaining({ duration: 300 }),
    );
  });

  it('registers asynchronous cards without rescanning the page or nesting reveals', () => {
    const parent = new TestElement();
    const nested = new TestElement(); nested.parentElement = parent;
    const { container } = setup(parent);
    const next = new TestElement(); next.parentElement = container;
    mutated([{ addedNodes: [next, nested, next] }]);
    expect(container.querySelectorAll).toHaveBeenCalledTimes(1);
    expect([...observed]).toEqual([parent, next]);
  });

  it('leaves the journey and focused elements alone', () => {
    const journey = new TestElement(); journey.excluded = true;
    const focused = new TestElement();
    vi.stubGlobal('document', { activeElement: focused });
    setup(journey, focused).enter();
    expect(journey.animate).not.toHaveBeenCalled();
    expect(focused.animate).not.toHaveBeenCalled();
  });

  it('cancels motion on focus, preference changes and navigation cleanup', () => {
    const first = new TestElement(); const second = new TestElement();
    const { container, enter, cleanup } = setup(first, second);
    enter();
    container.listeners.get('focusin')?.({ target: first });
    expect(first.animation.cancel).toHaveBeenCalled();
    preference.matches = true;
    preference.addEventListener.mock.calls[0][1]();
    expect(second.animation.cancel).toHaveBeenCalled();
    cleanup();
    expect(disconnectIntersection).toHaveBeenCalledOnce();
    expect(disconnectMutation).toHaveBeenCalledOnce();
    expect(preference.removeEventListener).toHaveBeenCalledOnce();
    expect(container.listeners.size).toBe(0);
  });

  it('degrades to static content if animation APIs are unavailable', () => {
    vi.stubGlobal('window', {});
    const container = new TestElement();
    expect(() => observeReveals(container as unknown as HTMLElement)()).not.toThrow();
    expect(container.querySelectorAll).not.toHaveBeenCalled();
  });
});
