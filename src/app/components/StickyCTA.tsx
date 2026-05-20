import { useState, useEffect } from 'react';
import { Calculator, MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router';

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const showCalculatorCta = location.pathname !== '/services';

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed bottom-3 left-3 right-3 z-50 animate-fadeIn rounded-[22px] border border-white/70 bg-white/92 p-2.5 shadow-[0_20px_50px_rgba(17,17,17,0.18)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
          Quick Actions
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {showCalculatorCta ? (
            <a
              href="#calculator"
              className="flex flex-1 items-center justify-center gap-2 rounded-[18px] border border-black/8 bg-black/[0.04] px-4 py-3 text-center text-sm font-semibold text-foreground transition-all active:scale-95"
            >
              <Calculator className="w-5 h-5" />
              <span>Landing Price</span>
            </a>
          ) : null}
          <a
            href="https://wa.me/642885307225"
            target="_blank"
            rel="noopener noreferrer"
            className={`${showCalculatorCta ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 rounded-[18px] bg-[#151515] px-4 py-3 text-center text-sm font-semibold text-white transition-all active:scale-95`}
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
              <a
                href="#calculator"
                className="group flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 font-semibold text-white shadow-[0_22px_50px_rgba(199,162,74,0.32)] transition-all hover:scale-[1.02] hover:bg-primary/90"
              >
                <Calculator className="w-6 h-6" />
                <span>Landing Price</span>
              </a>
            ) : null}

            <a
              href="https://wa.me/642885307225"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl bg-[#151515] px-6 py-4 font-semibold text-white shadow-[0_22px_50px_rgba(17,17,17,0.28)] transition-all hover:scale-[1.02] hover:bg-[#202020]"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Chat on WhatsApp</span>
            </a>

            <button
              onClick={() => setIsExpanded(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-sm text-white transition-all hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              <span>Minimize</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="rounded-full bg-primary p-4 text-white shadow-[0_20px_40px_rgba(199,162,74,0.3)] transition-all hover:scale-105 hover:bg-primary/90"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </>
  );
}
