import { useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouteError } from 'react-router';
import { SiteTranslatorProvider, useLanguage } from './SiteTranslator';
import { recoverRouteChunk } from '../lib/routeRecovery';

function RouteErrorContent() {
  const error = useRouteError();
  const { text } = useLanguage();

  useEffect(() => {
    try {
      recoverRouteChunk(error, {
        pathname: window.location.pathname,
        online: navigator.onLine,
        storage: window.sessionStorage,
        // A full reload gets the latest entry script and retains filters and anchors.
        reload: () => window.location.reload(),
      });
    } catch {
      // Restricted browser storage still leaves the manual recovery controls usable.
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-background px-6 py-20 text-foreground">
      <div className="mx-auto w-full max-w-xl text-center">
        <a href="/" className="text-sm font-bold tracking-[0.22em] text-primary" aria-label={text({ en: 'Inno Group home', zh: 'Inno Group 首页' })}>INNO GROUP</a>
        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RefreshCw className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl">{text({ en: 'Let’s get you back on track.', zh: '让我们重新打开这个页面。' })}</h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground">{text({ en: 'This page could not load. Please refresh to try again, or return to the home page.', zh: '这个页面暂时未能加载。请刷新重试，或返回首页继续浏览。' })}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="button-primary" onClick={() => window.location.reload()}><RefreshCw className="h-5 w-5" aria-hidden="true" />{text({ en: 'Refresh page', zh: '刷新页面' })}</button>
          <a href="/" className="button-secondary"><ArrowLeft className="h-5 w-5" aria-hidden="true" />{text({ en: 'Back home', zh: '返回首页' })}</a>
        </div>
      </div>
    </main>
  );
}

export function RouteErrorBoundary() {
  return <SiteTranslatorProvider><RouteErrorContent /></SiteTranslatorProvider>;
}
