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
    ? 'text-slate-600 dark:text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700'
    : 'text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700';

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-colors ${buttonClasses}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
