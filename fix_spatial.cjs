const fs = require('fs');
let code = fs.readFileSync('src/components/SpatialQueryPanel.tsx', 'utf8');

// Replace invalid tailwind classes
code = code.replace(/border-slate-150/g, 'border-slate-200');
code = code.replace(/text-emerald-650/g, 'text-emerald-600');
code = code.replace(/border-slate-250/g, 'border-slate-300');
code = code.replace(/border-slate-705/g, 'border-slate-700');

// Make the Spatial Query Panel look more premium
code = code.replace(
  /className=\{`shrink-0 border p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col gap-4 font-sans relative overflow-hidden transition-all duration-300 md:w-64 \$\{[\s\S]*?\}\`\}/,
  `className={\`shrink-0 border p-4 sm:p-5 rounded-2xl flex flex-col gap-4 font-sans relative overflow-hidden transition-all duration-300 md:w-64 \${isDarkMode ? "bg-slate-900/60 border-slate-700/50 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] text-slate-100" : "bg-white/80 border-slate-200/60 shadow-lg text-slate-800"}\`}`
);

fs.writeFileSync('src/components/SpatialQueryPanel.tsx', code);
console.log("SpatialQueryPanel styling fixed.");
