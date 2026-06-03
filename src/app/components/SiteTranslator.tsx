import { useEffect, useState } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

const TRANSLATE_SCRIPT_ID = 'google-translate-script';
const TRANSLATE_ELEMENT_ID = 'google_translate_element';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000`;
  document.cookie = `${name}=${value};path=/;domain=${window.location.hostname};max-age=31536000`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
  document.cookie = `${name}=;path=/;domain=${window.location.hostname};max-age=0`;
}

function triggerGoogleTranslate(language: 'en' | 'zh-CN') {
  const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');

  if (language === 'en') {
    clearCookie('googtrans');
    window.location.reload();
    return;
  }

  setCookie('googtrans', `/en/${language}`);

  if (select) {
    select.value = language;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  window.location.reload();
}

export function SiteTranslatorProvider() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,zh-CN',
          autoDisplay: false,
        },
        TRANSLATE_ELEMENT_ID
      );
    };

    if (!document.getElementById(TRANSLATE_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = TRANSLATE_SCRIPT_ID;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      <div id={TRANSLATE_ELEMENT_ID} className="fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden" />
      <style>{`
        .goog-te-banner-frame,
        .goog-te-gadget-icon,
        .goog-te-balloon-frame,
        #goog-gt-tt {
          display: none !important;
        }

        body {
          top: 0 !important;
        }

        .skiptranslate {
          font-size: 0 !important;
        }
      `}</style>
    </>
  );
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'zh-CN'>('en');

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('googtrans='))
      ?.split('=')[1];

    if (cookie?.includes('/zh-CN')) {
      setActiveLanguage('zh-CN');
    }
  }, []);

  const buttonBase =
    'notranslate rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors';
  const wrapperClass = compact
    ? 'notranslate grid grid-cols-2 gap-2 rounded-2xl border border-black/8 bg-white/70 p-1.5'
    : 'notranslate inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/64 p-1 shadow-sm';

  return (
    <div className={wrapperClass} translate="no" aria-label="Language switcher">
      <button
        type="button"
        onClick={() => {
          setActiveLanguage('en');
          triggerGoogleTranslate('en');
        }}
        className={`${buttonBase} ${
          activeLanguage === 'en' ? 'bg-[#151515] text-white' : 'text-foreground/68 hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveLanguage('zh-CN');
          triggerGoogleTranslate('zh-CN');
        }}
        className={`${buttonBase} ${
          activeLanguage === 'zh-CN' ? 'bg-primary text-white' : 'text-foreground/68 hover:text-foreground'
        }`}
      >
        中文
      </button>
    </div>
  );
}
