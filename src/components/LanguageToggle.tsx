import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

interface LanguageToggleProps {
  isDarkHeader?: boolean;
  className?: string;
  isCircular?: boolean;
  variant?: 'dropdown' | 'segmented';
}

const LANGUAGES = [
  { code: 'id', label: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'zh', label: 'ZH', name: '中文', flag: '🇨🇳' },
];

export default function LanguageToggle({
  isDarkHeader,
  className = '',
  isCircular = false,
  variant = 'dropdown',
}: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rawLang = i18n.language || 'id';
  const currentLangCode = rawLang.startsWith('zh')
    ? 'zh'
    : rawLang.startsWith('en')
    ? 'en'
    : 'id';

  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('i18nextLng', code);
    } catch {
      // ignore storage errors
    }
    setIsOpen(false);
  };

  if (variant === 'segmented') {
    return (
      <div
        className={`flex items-center justify-between gap-2 p-1.5 rounded-xl border ${
          isDarkHeader
            ? 'bg-[#0F2942]/80 border-white/[0.10] text-slate-200'
            : 'bg-slate-100/90 border-slate-200/90 text-slate-700'
        } ${className}`}
      >
        <span className="flex items-center gap-1.5 pl-2 text-xs font-semibold">
          <Globe size={14} className={isDarkHeader ? 'text-emerald-400' : 'text-emerald-700'} />
          <span>Bahasa</span>
        </span>
        <div className="flex items-center gap-1">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLangCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isDarkHeader
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                    : isDarkHeader
                      ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const buttonClasses = isDarkHeader
    ? 'text-slate-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12]'
    : 'text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] border border-slate-200/90 dark:border-white/[0.12]';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={isCircular 
          ? `w-9 h-9 xs:w-10 xs:h-10 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${buttonClasses}`
          : `flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${buttonClasses}`}
        title="Pilih Bahasa / Select Language"
      >
        {isCircular ? (
          <span className={`font-mono text-[11px] font-bold uppercase tracking-tight ${isDarkHeader ? 'text-emerald-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {currentLang.label}
          </span>
        ) : (
          <>
            <Globe size={15} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="uppercase tracking-wider">{currentLang.label}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-surface/95 border border-slate-200 dark:border-white/15 shadow-2xl py-1.5 z-[9999] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 mb-1">
            Bahasa / Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLangCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
                {isSelected && <Check size={14} className="text-emerald-700 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
