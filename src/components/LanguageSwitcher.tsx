import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, X } from "lucide-react";

export default function LanguageSwitcher({ isDark }: { isDark: boolean }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [autoTranslate, setAutoTranslate] = useState(() => {
    const stored = localStorage.getItem("autoTranslate");
    return stored === null ? true : stored === "true";
  });

  const languages = [
    { code: "id", label: "ID" },
    { code: "en", label: "EN" },
    { code: "zh", label: "中文" },
  ];

  const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const toggleDropdown = () => setIsOpen(!isOpen);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    // Dispatch event to make sure any listening components refresh their auto-translated views
    window.dispatchEvent(new Event("languagechange"));
  };

  const handleToggleAutoTranslate = (checked: boolean) => {
    localStorage.setItem("autoTranslate", checked ? "true" : "false");
    setAutoTranslate(checked);
    window.dispatchEvent(new Event("autoTranslateChange"));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center justify-between gap-1.5 h-10 md:h-9 px-3 md:px-2.5 border rounded-xl md:rounded-lg text-xs md:text-sm font-bold transition-all active:scale-95 shrink-0 cursor-pointer ${
          isDark
            ? "border-slate-700/80 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700"
            : "border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100"
        }`}
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="leading-none mt-[1px]">{currentLang.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for Mobile devices (Android/iOS) to dismiss easily and prevent clipping */}
          <div
            className="fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-[2px] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`fixed top-20 left-4 right-4 mx-auto max-w-xs z-[9999] sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-60 sm:mx-0 rounded-2xl md:rounded-xl shadow-2xl border p-3.5 md:p-3 transition-all animate-in fade-in zoom-in-95 duration-150 ${
              isDark 
                ? "bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/50" 
                : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/20"
            }`}
          >
            <div className="flex items-center justify-between px-1 py-0.5 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <span className="text-[11px] md:text-[10px] font-extrabold tracking-wider uppercase opacity-70 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                {t("languageSwitcher.selectLanguage", "PILIH BAHASA / LANGUAGE")}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {languages.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`py-2.5 sm:py-1.5 px-2 text-xs md:text-[11px] font-bold rounded-xl text-center transition-all active:scale-95 cursor-pointer ${
                    i18n.language === lang.code
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30"
                      : isDark
                      ? "text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/50"
                      : "text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-2.5"></div>

            <div className="p-1">
              <label className="flex items-start gap-2.5 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => handleToggleAutoTranslate(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 md:w-3.5 md:h-3.5 accent-emerald-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold select-none leading-none text-slate-800 dark:text-slate-200">
                    {t("languageSwitcher.autoTranslate", "Auto-Translate Spasial")}
                  </span>
                  <span className="text-[10px] md:text-[9px] opacity-70 leading-normal mt-1 select-none text-slate-600 dark:text-slate-400">
                    {t("languageSwitcher.autoTranslateDesc", "Terjemahkan otomatis deskripsi & tooltip spasial")}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
