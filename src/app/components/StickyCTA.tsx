import { useState, useEffect } from 'react';
import { Calculator, MessageCircle, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useLanguage } from './SiteTranslator';

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { text } = useLanguage();
  const showCalculatorCta = location.pathname === '/' || location.pathname === '/vehicles/find-my-car';
  const hasVehicleSpecificActions = /^\/japan-market\/JP[\w-]+$/i.test(location.pathname);
  const calculatorHref = '#calculator';

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || hasVehicleSpecificActions) return null;

  return (
    <>
      <div
        className="fixed bottom-2 left-3 right-3 z-50 animate-fadeIn rounded-[18px] border border-white/70 bg-white/92 p-2 shadow-[0_16px_40px_rgba(17,17,17,0.16)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2">
          {showCalculatorCta ? (
            <Link
              to={calculatorHref}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-black/8 bg-black/[0.04] px-3 py-2.5 text-center text-sm font-semibold text-foreground transition-all active:scale-95"
            >
              <Calculator className="w-5 h-5" />
              <span>{text({ en: 'Landing Price', zh: '落地价' })}</span>
            </Link>
          ) : null}
          <a
            href="https://wa.me/64272858065"
            target="_blank"
            rel="noopener noreferrer"
            className={`${showCalculatorCta ? 'flex-1' : 'w-full'} flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#151515] px-3 py-2.5 text-center text-sm font-semibold text-white transition-all active:scale-95`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-50 hidden space-y-3 animate-fadeIn md:block">
        {isExpanded ? (
          <>
            {showCalculatorCta ? (
              <Link
                to={calculatorHref}
                className="group flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 font-semibold text-white shadow-[0_22px_50px_rgba(199,162,74,0.32)] transition-all hover:scale-[1.02] hover:bg-primary/90"
              >
                <Calculator className="w-6 h-6" />
              <span>{text({ en: 'Landing Price', zh: '落地价' })}</span>
              </Link>
            ) : null}

            <a
              href="https://wa.me/64272858065"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl bg-[#151515] px-6 py-4 font-semibold text-white shadow-[0_22px_50px_rgba(17,17,17,0.28)] transition-all hover:scale-[1.02] hover:bg-[#202020]"
            >
              <MessageCircle className="w-6 h-6" />
              <span>{text({ en: 'Chat on WhatsApp', zh: 'WhatsApp 咨询' })}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label={text({ en: 'Minimize quick actions', zh: '收起快捷操作' })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-sm text-white transition-all hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              <span>{text({ en: 'Minimize', zh: '收起' })}</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label={text({ en: 'Open quick actions', zh: '打开快捷操作' })}
            className="rounded-full bg-primary p-4 text-white shadow-[0_20px_40px_rgba(199,162,74,0.3)] transition-all hover:scale-105 hover:bg-primary/90"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </>
  );
}
