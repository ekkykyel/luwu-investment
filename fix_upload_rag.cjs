const fs = require('fs');
let code = fs.readFileSync('src/components/UploadRagPanel.tsx', 'utf8');

// Replace invalid tailwind classes
code = code.replace(/border-slate-150/g, 'border-slate-200');
code = code.replace(/text-slate-850/g, 'text-slate-800');

// Make the Spatial Query Panel look more premium
code = code.replace(
  /className=\{`shrink-0 border flex flex-col gap-3 p-4 mt-2 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-xl \$\{[\s\S]*?\}\`\}/,
  `className={\`shrink-0 border flex flex-col gap-3 p-4 mt-2 rounded-2xl relative overflow-hidden transition-all duration-300 \${isDarkMode ? "bg-slate-900/60 border-slate-700/50 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] text-slate-100" : "bg-white/80 border-slate-200/60 shadow-lg text-slate-800"}\`}`
);

fs.writeFileSync('src/components/UploadRagPanel.tsx', code);
console.log("UploadRagPanel styling fixed.");
