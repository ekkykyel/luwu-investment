const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// We will refine the Operator Workspace styling.
// 1. Refine the header part (KONSOL MANAJEMEN OPERATOR)
// 2. Refine the quick stats cards
// 3. Refine the list view styling

code = code.replace(
  /<h2 className="text-xl font-display font-black tracking-wider bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">\s*KONSOL MANAJEMEN OPERATOR\s*<\/h2>\s*<p className="text-xs text-slate-400 mt-1 max-w-2xl">\s*Kelola master data proyek investasi, uji kualifikasi spasial, dan berkas analisis RAG Kabupaten Luwu.\s*<\/p>/g,
  `<h2 className="text-2xl font-display font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                Operator Workspace
              </h2>
              <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Manajemen data sentral untuk investasi strategis Kabupaten Luwu. Akses kontrol intelijen spasial, uji kualifikasi, dan manajemen RAG terpadu.
              </p>`
);

// We need to match the stats grid:
// <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// ...
// <div key={i} className={`relative p-5 rounded-3xl border overflow-hidden flex flex-col justify-between backdrop-blur-md transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${isDarkMode ? "bg-slate-900/40 border-slate-700/50 hover:shadow-emerald-900/20" : "bg-white/60 border-white/40 shadow-sm hover:shadow-emerald-100"}`}>
// Let's make the stats cards look ultra-premium.

code = code.replace(
  /className=\{`relative p-5 rounded-3xl border overflow-hidden flex flex-col justify-between backdrop-blur-md transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl \$\{isDarkMode \? "bg-slate-900\/40 border-slate-700\/50 hover:shadow-emerald-900\/20" : "bg-white\/60 border-white\/40 shadow-sm hover:shadow-emerald-100"}`}/g,
  `className={\`relative p-5 rounded-2xl border overflow-hidden flex flex-col justify-between backdrop-blur-xl transition-all duration-500 ease-out group hover:-translate-y-1 hover:shadow-2xl \${isDarkMode ? "bg-slate-900/60 border-slate-700/50 hover:border-slate-600/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]" : "bg-white/80 border-slate-200/60 shadow-lg hover:border-slate-300"}\`}`
);

// Update investment row classes for premium feel
code = code.replace(
  /className=\{`grid grid-cols-\[2\.5fr_1fr_1\.2fr_0\.8fr_1\.2fr_90px\] items-center text-xs border-b border-emerald-500\/10 transition-all duration-200 ease-out hover:scale-\[1\.008\] hover:z-10 origin-center cursor-pointer \$\{[\s\S]*?hover:border-emerald-300\/50"[\s\S]*?\}`}/,
  `className={\`grid grid-cols-[2.5fr_1fr_1.2fr_0.8fr_1.2fr_90px] items-center text-xs border-b transition-all duration-200 ease-out hover:z-10 cursor-pointer \${
        isDarkMode 
          ? "border-slate-800/60 hover:bg-slate-800/40 hover:text-white"
          : "border-slate-100 hover:bg-slate-50"
      }\`}`
);

// Update table header row classes
code = code.replace(
  /className=\{`grid grid-cols-\[2\.5fr_1fr_1\.2fr_0\.8fr_1\.2fr_90px\] text-xs font-bold border-b border-emerald-500\/10 \$\{isDarkMode \? "bg-slate-950\/65 text-slate-400" : "bg-slate-100 text-slate-700"\}`}/,
  `className={\`grid grid-cols-[2.5fr_1fr_1.2fr_0.8fr_1.2fr_90px] text-[11px] font-semibold tracking-wider uppercase border-b \${isDarkMode ? "bg-slate-900/80 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200"}\`}`
);

// Update table wrapper
code = code.replace(
  /className=\{`overflow-hidden border border-emerald-500\/10 rounded-2xl \$\{isDarkMode \? "bg-slate-900\/50" : "bg-white"\}`}/,
  `className={\`overflow-hidden border rounded-xl shadow-sm \${isDarkMode ? "bg-slate-900/30 border-slate-800/80" : "bg-white border-slate-200"}\`}`
);

// Update table header text color
code = code.replace(
  /className="flex items-center justify-between px-3 py-2 bg-slate-950\/50 border-b border-emerald-500\/10 text-\[10px\] text-slate-400 font-mono"/,
  `className={\`flex items-center justify-between px-4 py-2.5 border-b text-[10px] font-mono \${isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}\`}`
);

// Make the buttons (Tambah Investasi, etc) look more premium
code = code.replace(
  /className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide"/g,
  `className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold font-sans rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wide"`
);
code = code.replace(
  /className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold font-sans rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"/g,
  `className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-semibold font-sans rounded-lg border border-slate-700/50 shadow-sm transition-all flex items-center justify-center gap-2 tracking-wide"`
);
code = code.replace(
  /className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-sans rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"/g,
  `className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-semibold font-sans rounded-lg border border-slate-700/50 shadow-sm transition-all flex items-center justify-center gap-2 tracking-wide"`
);
code = code.replace(
  /className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold font-sans rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"/g,
  `className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-semibold font-sans rounded-lg border border-slate-700/50 shadow-sm transition-all flex items-center justify-center gap-2 tracking-wide"`
);


fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx Operator Workspace styling updated.");
