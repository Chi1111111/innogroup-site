import { useEffect, useRef, useState } from 'react';
import steps from './steps.json';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;
const ease = (value: number) => value * value * (3 - 2 * value);

/** Only the scene's SVG transforms change per frame; React updates at chapter boundaries. */
export function useImportJourney(language: 'en' | 'zh') {
  const root = useRef<HTMLElement>(null);
  const navigate = useRef<(index: number) => void>(() => {});
  const [stage, setStage] = useState(0);
  const [motion, setMotion] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const rail = container.querySelector<HTMLElement>('.import-visual')!;
    const scene = container.querySelector<HTMLElement>('.import-scene')!;
    const story = container.querySelector<HTMLElement>('.import-story')!;
    const chapters = Array.from(container.querySelectorAll<HTMLElement>('.import-chapter'));
    const environments = Array.from(container.querySelectorAll<SVGElement>('.environment'));
    const architectures = environments.map((el) => el.querySelector<SVGElement>('.scene-architecture'));
    const car = container.querySelector<SVGElement>('#import-moving-car')!;
    const ship = container.querySelector<SVGElement>('#import-ship-bob');
    const camera = container.querySelector<SVGElement>('#import-scene-camera')!;
    const mobile = window.matchMedia('(max-width: 980px)');
    const finePointer = window.matchMedia('(pointer: fine)');
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let anchors: number[] = [];
    let readerOffset = 0;
    let target = 0;
    let progress = 0;
    let currentStage = -1;
    let frame = 0;
    let measurement = 0;
    let previousTime = 0;
    let visible = true;
    let disposed = false;
    let navigation: {
      index: number;
      fromY: number;
      toY: number;
      fromProgress: number;
      started: number;
      duration: number;
    } | null = null;

    container.querySelectorAll<SVGElement>('[data-en][data-zh]').forEach((el) => {
      el.textContent = el.dataset[language] ?? '';
    });

    const paint = () => {
      const from = Math.min(steps.length - 1, Math.floor(progress));
      const to = Math.min(steps.length - 1, from + 1);
      const fraction = progress - from;
      const blend = motion ? ease(clamp((fraction - 0.25) / 0.5)) : Number(fraction >= 0.5);
      const nextStage = Math.min(steps.length - 1, from + Number(blend >= 0.5));
      if (nextStage !== currentStage) {
        currentStage = nextStage;
        setStage(nextStage);
        container.dataset.stage = String(nextStage);
      }
      environments.forEach((environment, index) => {
        const opacity = from === to && index === from ? 1 : index === from ? 1 - blend : index === to ? blend : 0;
        environment.style.opacity = String(opacity);
        environment.classList.toggle('visible', opacity > 0.001);
        if (opacity <= 0.001) return;
        const distance = index === from ? -blend : 1 - blend;
        environment.style.transform = motion
          ? `translate(${distance * 47}px, ${Math.abs(distance) * 13}px) scale(${1 - Math.abs(distance) * 0.045})`
          : '';
        const architecture = architectures[index];
        if (architecture) architecture.style.opacity = String(clamp(opacity * 1.5));
      });
      const [baseX, baseY, scale] = steps[from].car.map((value, index) => mix(value, steps[to].car[index], blend));
      const road = motion && from !== 3 && from !== 2 ? Math.sin(clamp(fraction / 0.6) * Math.PI) * 9 : 0;
      const shipWeight = from === 3 ? 1 - blend : to === 3 ? blend : 0;
      const shipX = motion ? (clamp(progress - 2.55) - 0.42) * 33 : 0;
      const shipY = shipX * -0.18;
      const x = baseX + road + shipX * shipWeight;
      const y = baseY + road * 0.47 + shipY * shipWeight;
      ship?.setAttribute('transform', `translate(${shipX} ${shipY})`);
      car.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
      const zoom = (motion ? Math.sin(fraction * Math.PI) * 0.018 : 0) - shipWeight * 0.045;
      camera.setAttribute('transform', `translate(500 ${355 + shipWeight * 9}) scale(${1 + zoom}) translate(-500 -355)`);
      scene.style.transform = motion && !mobile.matches
        ? `translate3d(${pointer.x * 5}px, ${pointer.y * 3}px, 0)`
        : '';
      container.style.setProperty('--import-progress', String(progress / (steps.length - 1)));
    };

    const requestRender = () => {
      if (!frame && (visible || navigation) && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = clamp(now - (previousTime || now - 16), 8, 40);
      previousTime = now;
      const oldProgress = progress;
      if (navigation) {
        // One clock drives the page and the illustration. Native smooth scrolling plus
        // a second easing loop can lag behind clicks, especially across several steps.
        const fraction = clamp((now - navigation.started) / navigation.duration);
        const amount = ease(fraction);
        window.scrollTo({ top: mix(navigation.fromY, navigation.toY, amount), behavior: 'instant' });
        progress = mix(navigation.fromProgress, navigation.index, amount);
        target = progress;
        if (fraction === 1) {
          navigation = null;
          delete container.dataset.navigating;
        }
      } else {
        progress = motion ? mix(progress, target, 1 - Math.exp(-dt / 73)) : target;
      }
      if (Math.abs(progress - target) < 0.0003) progress = target;
      pointer.x = mix(pointer.x, pointer.tx, 0.13);
      pointer.y = mix(pointer.y, pointer.ty, 0.13);
      paint();
      container.classList.toggle('import-driving', motion && Math.abs(progress - oldProgress) > 0.002 && currentStage !== 3);
      if (navigation || Math.abs(progress - target) > 0.0001 || Math.abs(pointer.x - pointer.tx) > 0.005 || Math.abs(pointer.y - pointer.ty) > 0.005) requestRender();
      else container.classList.remove('import-driving');
    };
    const readScroll = () => {
      if (!anchors.length || navigation) return;
      const at = window.scrollY + readerOffset;
      if (at <= anchors[0]) target = 0;
      else if (at >= anchors[anchors.length - 1]) target = anchors.length - 1;
      else {
        let index = 0;
        while (index < anchors.length - 2 && at >= anchors[index + 1]) index++;
        const start = anchors[index];
        const fraction = clamp((at - start) / Math.max(1, anchors[index + 1] - start));
        target = index + (mobile.matches ? ease(clamp((fraction - 0.74) / 0.26)) : fraction);
      }
      requestRender();
    };
    const destinationFor = (index: number) => {
      const destination = index === 0 ? 0 : anchors[index] - readerOffset;
      return clamp(destination, 0, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    };
    const measure = () => {
      const header = 80;
      const railHeight = getComputedStyle(rail).position === 'sticky' ? rail.offsetHeight : 0;
      readerOffset = mobile.matches
        ? header + railHeight + Math.max(48, (window.innerHeight - header - railHeight) * 0.2)
        : header + (window.innerHeight - header) * 0.47;
      anchors = chapters.map((chapter) => chapter.getBoundingClientRect().top + window.scrollY + (mobile.matches ? 80 : chapter.offsetHeight * 0.47));
      if (navigation) navigation.toY = destinationFor(navigation.index);
      readScroll();
    };
    const queueMeasure = () => {
      if (!measurement) measurement = requestAnimationFrame(() => { measurement = 0; measure(); });
    };
    const movePointer = (event: PointerEvent) => {
      if (!motion || !finePointer.matches || mobile.matches) return;
      const rect = scene.getBoundingClientRect();
      pointer.tx = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      pointer.ty = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      requestRender();
    };
    const resetPointer = () => { pointer.tx = pointer.ty = 0; requestRender(); };
    const visibilityChange = () => {
      container.classList.toggle('import-offscreen', document.hidden || !visible);
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else { previousTime = 0; readScroll(); requestRender(); }
    };

    navigate.current = (index) => {
      // Focus first: focusing after starting a smooth scroll can interrupt it.
      const selected = clamp(index, 0, steps.length - 1);
      chapters[selected].focus({ preventScroll: true });
      measure();
      const destination = destinationFor(selected);
      // A new click replaces the in-flight destination immediately, without a queue.
      navigation = motion ? {
        index: selected, fromY: window.scrollY, toY: destination,
        fromProgress: progress, started: performance.now(),
        duration: clamp(420 + Math.abs(destination - window.scrollY) * 0.1, 420, 850),
      } : null;
      if (navigation) container.dataset.navigating = String(selected);
      else {
        delete container.dataset.navigating;
        window.scrollTo({ top: destination, behavior: 'instant' });
        progress = target = selected;
        paint();
      }
      previousTime = 0;
      requestRender();
    };
    const interruptNavigation = () => {
      if (!navigation) return;
      navigation = null;
      delete container.dataset.navigating;
      readScroll();
    };
    const scrollKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Enter', 'Escape'].includes(event.key)) interruptNavigation();
    };
    const resize = new ResizeObserver(queueMeasure);
    resize.observe(story);
    resize.observe(rail);
    chapters.forEach((chapter) => resize.observe(chapter.querySelector('.import-chapter-body')!));
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      container.classList.toggle('import-offscreen', !visible || document.hidden);
      if (visible) { previousTime = 0; readScroll(); requestRender(); }
      else if (!navigation) { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: '120px' });
    intersection.observe(rail);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', queueMeasure, { passive: true });
    window.addEventListener('wheel', interruptNavigation, { passive: true });
    window.addEventListener('touchstart', interruptNavigation, { passive: true });
    window.addEventListener('pointerdown', interruptNavigation, { passive: true });
    window.addEventListener('keydown', scrollKey);
    document.addEventListener('visibilitychange', visibilityChange);
    scene.addEventListener('pointermove', movePointer);
    scene.addEventListener('pointerleave', resetPointer);
    measure();
    progress = target;
    paint();
    void document.fonts.ready.then(() => { if (!disposed) queueMeasure(); });

    return () => {
      disposed = true;
      navigate.current = () => {};
      delete container.dataset.navigating;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measurement);
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', queueMeasure);
      window.removeEventListener('wheel', interruptNavigation);
      window.removeEventListener('touchstart', interruptNavigation);
      window.removeEventListener('pointerdown', interruptNavigation);
      window.removeEventListener('keydown', scrollKey);
      document.removeEventListener('visibilitychange', visibilityChange);
      scene.removeEventListener('pointermove', movePointer);
      scene.removeEventListener('pointerleave', resetPointer);
    };
  }, [language, motion]);

  return { root, navigate, stage, motion, setMotion };
}
