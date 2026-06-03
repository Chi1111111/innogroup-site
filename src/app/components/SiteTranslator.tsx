import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'zh';
export type LocalizedText = string | { en: string; zh: string };

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  text: (copy: LocalizedText) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = 'inno-language';

export function SiteTranslatorProvider({ children }: { children?: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (savedLanguage === 'zh') {
      setLanguageState('zh');
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en-NZ';
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      text: (copy) => (typeof copy === 'string' ? copy : copy[language]),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside SiteTranslatorProvider');
  }

  return context;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const buttonBase =
    'rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors';
  const wrapperClass = compact
    ? 'grid grid-cols-2 gap-2 rounded-2xl border border-black/8 bg-white/70 p-1.5'
    : 'inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/64 p-1 shadow-sm';

  return (
    <div className={wrapperClass} aria-label="Language switcher">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${buttonBase} ${
          language === 'en' ? 'bg-[#151515] text-white' : 'text-foreground/68 hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('zh')}
        className={`${buttonBase} ${
          language === 'zh' ? 'bg-primary text-white' : 'text-foreground/68 hover:text-foreground'
        }`}
      >
        中文
      </button>
    </div>
  );
}
