import React from 'react';
import { Target } from 'lucide-react';

export default function MapCrosshair({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-50 flex items-center justify-center">
      <div className={`relative flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
        <div className="w-8 h-[1px] absolute bg-current opacity-30"></div>
        <div className="h-8 w-[1px] absolute bg-current opacity-30"></div>
        <Target className="w-5 h-5 opacity-40" />
      </div>
    </div>
  );
}
