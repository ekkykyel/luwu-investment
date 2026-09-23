import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

interface LanguageToggleProps {
  isDarkHeader?: boolean;
  className?: string;
}

const LANGUAGES = [
  { code: 'id', label: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'zh', label: 'ZH', name: '中文', flag: '🇨🇳' },
];

export default function LanguageToggle({ isDarkHeader, className = '' }: LanguageToggleProps) {
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

  const buttonClasses = isDarkHeader
    ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10'
    : 'text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10';

  return (
    <div 
      className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-20'} ${className}`} 
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Pilih Bahasa / Select Language"
        className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${buttonClasses}`}
        title="Pilih Bahasa / Select Language"
      >
        <Globe size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="uppercase tracking-wider">{currentLang.label}</span>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-950/25 dark:shadow-black/70 py-1.5 z-[9999] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'top right' }}
        >
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 mb-1">
            Bahasa / Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLangCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
                {isSelected && <Check size={15} className="text-emerald-600 dark:text-emerald-400 font-bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
