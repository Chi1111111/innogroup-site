import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { marketSnapshotToRestore } from '../lib/japanMarketNavigation';

export function ScrollToTop() {
  const location = useLocation();
  const { pathname, hash } = location;
  const navigationType = useNavigationType();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    if (!hash) {
      // Japan Market restores after its asynchronous results have rendered.
      if (marketSnapshotToRestore(location, navigationType)) return;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
    // Query-only changes keep the existing filter/pagination scroll behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash]);

  return null;
}
