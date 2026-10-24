import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigation } from 'react-router';
import { observeReveals } from '../lib/siteMotion';
import { useLanguage } from './SiteTranslator';

export function PageMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => root.current ? observeReveals(root.current) : undefined, []);
  return <div ref={root} className="page-motion">{children}</div>;
}

export function RouteProgress() {
  const navigation = useNavigation();
  const { text } = useLanguage();
  if (navigation.state === 'idle') return null;
  return <div className="route-progress" role="status">
    <span className="sr-only">{text({ en: 'Opening page…', zh: '正在打开页面…' })}</span>
    <span className="motion-loading-line" aria-hidden="true" />
  </div>;
}
