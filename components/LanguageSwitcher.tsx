'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`
          px-3 py-1.5 rounded-md text-sm font-medium transition-all
          ${language === 'en'
            ? 'bg-white text-primary-navy shadow-sm'
            : 'text-white/70 hover:text-white hover:bg-white/10'
          }
        `}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('he')}
        className={`
          px-3 py-1.5 rounded-md text-sm font-medium transition-all
          ${language === 'he'
            ? 'bg-white text-primary-navy shadow-sm'
            : 'text-white/70 hover:text-white hover:bg-white/10'
          }
        `}
        aria-label="Switch to Hebrew"
      >
        עב
      </button>
    </div>
  );
}
