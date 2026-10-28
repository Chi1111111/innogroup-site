import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { marketSnapshotToRestore, saveMarketSnapshot, type MarketLayout } from '../lib/japanMarketNavigation';

export function useJapanMarketNavigation(resultsReady: boolean) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoration = useMemo(() => marketSnapshotToRestore(location, navigationType), [location, navigationType]);
  const pending = useRef(restoration);
  const [layout, setLayout] = useState<MarketLayout>(() => restoration?.layout || 'list');

  useEffect(() => {
    pending.current = restoration;
    if (restoration) setLayout(restoration.layout);
  }, [restoration]);

  const remember = useCallback(() => {
    if (!resultsReady || pending.current) return;
    saveMarketSnapshot({
      key: location.key,
      href: location.pathname + location.search,
      layout,
      scrollY: Math.max(0, window.scrollY),
    });
  }, [resultsReady, location.key, location.pathname, location.search, layout]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => { frame = 0; remember(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', remember);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', remember);
    };
  }, [remember]);

  useEffect(() => {
    const snapshot = pending.current;
    if (!resultsReady || !snapshot || snapshot.layout !== layout) return;
    // The correct async result set and its layout must exist before restoring a deep scroll position.
    let secondFrame = 0;
    const frame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: snapshot.scrollY, left: 0, behavior: 'instant' });
        pending.current = null;
        remember();
      });
    });
    return () => { window.cancelAnimationFrame(frame); window.cancelAnimationFrame(secondFrame); };
  }, [resultsReady, layout, restoration, remember]);

  const changeLayout = (next: MarketLayout) => {
    pending.current = null;
    setLayout(next);
  };
  const leaveResults = () => { remember(); pending.current = null; };

  return {
    layout,
    setLayout: changeLayout,
    remember: leaveResults,
    linkState: { japanMarketReturn: { key: location.key, href: location.pathname + location.search } },
  };
}
