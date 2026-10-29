import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{isDarkHeader?: boolean, isCircular?: boolean}> = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-5 h-5 text-emerald-500" />
      <button onClick={() => changeLanguage('id')} className={`px-2 py-1 rounded ${i18n.language === 'id' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>ID</button>
      <button onClick={() => changeLanguage('en')} className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>EN</button>
      <button onClick={() => changeLanguage('zh')} className={`px-2 py-1 rounded ${i18n.language === 'zh' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>ZH</button>
    </div>
  );
};
