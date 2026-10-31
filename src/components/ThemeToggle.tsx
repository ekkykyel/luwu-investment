import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDarkHeader?: boolean;
  isCircular?: boolean;
  className?: string;
}

export default function ThemeToggle({
  isDarkHeader,
  isCircular = false,
  className = '',
}: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('luwu_theme', newMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  };

  const buttonClasses = isDarkHeader
    ? 'text-amber-400 hover:text-amber-300 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12]'
    : 'text-slate-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 bg-[#FAF7F0] dark:bg-white/[0.06] hover:bg-[#ECE5D6] dark:hover:bg-white/[0.12] border border-[#E2DACB] dark:border-white/[0.12]';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        isCircular
          ? `w-9 h-9 xs:w-10 xs:h-10 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${buttonClasses} ${className}`
          : `p-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${buttonClasses} ${className}`
      }
      title={isDark ? 'Mode Terang / Light Mode' : 'Mode Gelap / Dark Mode'}
      aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
    >
      {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-700" />}
    </button>
  );
}

