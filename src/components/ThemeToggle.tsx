import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ isDarkHeader }: { isDarkHeader?: boolean }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial state
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const buttonClasses = isDarkHeader
    ? 'text-amber-400 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-700 border border-white/10'
    : 'text-slate-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10';

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${buttonClasses}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
    </button>
  );
}
