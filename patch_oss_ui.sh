cat << 'INNER_EOF' > /tmp/patch.js
const fs = require('fs');
let content = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

// Modernize the main wrapper and toggle switch
content = content.replace(
  /<div className="flex items-center justify-between bg-emerald-500\/10 dark:bg-emerald-400\/10 p-3 rounded-xl border border-emerald-500\/20">/,
  `<div className={\`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 \${isDetailed ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}\`}>`
);

content = content.replace(
  /<div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-\[''\] after:absolute after:top-\[2px\] after:left-\[2px\] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"><\/div>/,
  `<div className="w-12 h-6 bg-slate-300/80 peer-focus:outline-none rounded-full peer dark:bg-slate-700/80 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm dark:border-slate-600 peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-400"></div>`
);

// Beautify the simple inputs
content = content.replace(
  /className={\`w-full pl-14 pr-5 py-4 min-h-\[44px\] rounded-xl border font-medium text-lg outline-none transition-all \${inputBg}\`}/g,
  `className={\`w-full pl-14 pr-5 py-4 min-h-[52px] rounded-2xl border font-bold text-lg outline-none transition-all focus:ring-4 focus:ring-emerald-500/20 \${inputBg}\`}`
);

// Update detailed form wrappers
content = content.replace(
  /<div className={\`p-5 rounded-2xl border \${isDark \? "bg-slate-800\/40 border-slate-700\/50" : "bg-slate-50 border-slate-200"}\`}>/g,
  `<div className={\`p-5 md:p-6 rounded-3xl border transition-all duration-300 \${isDark ? "bg-slate-900/60 border-slate-700/50 hover:border-slate-600/80 shadow-xl shadow-black/20" : "bg-white border-slate-200 hover:border-slate-300 shadow-xl shadow-slate-200/50"}\`}>`
);

// Upgrade header buttons in detailed view
content = content.replace(
  /className="w-full flex items-center justify-between"/g,
  `className="w-full flex items-center justify-between group"`
);

content = content.replace(
  /<h4 className="font-semibold text-sm uppercase tracking-wide">Detailed CAPEX \(Modal Awal\)<\/h4>/,
  `<h4 className="font-bold text-sm md:text-base uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">Rincian CAPEX (Modal Awal)</h4>`
);

content = content.replace(
  /<h4 className="font-semibold text-sm uppercase tracking-wide">Estimasi Tenaga Kerja \(Labor Cost\)<\/h4>/,
  `<h4 className="font-bold text-sm md:text-base uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300">Estimasi Tenaga Kerja (TKA & TKL)</h4>`
);

content = content.replace(
  /<h4 className="font-semibold text-sm uppercase tracking-wide">Detailed OPEX \(Operasional\)<\/h4>/,
  `<h4 className="font-bold text-sm md:text-base uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Rincian OPEX (Operasional)</h4>`
);

// Add elegant chevron rotation
content = content.replace(
  /{isCapexExpanded \? <ChevronUp className="w-4 h-4" \/> : <ChevronDown className="w-4 h-4" \/>}/,
  `<div className={\`p-2 rounded-full transition-colors \${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}\`}><ChevronDown className={\`w-5 h-5 transition-transform duration-300 \${isCapexExpanded ? 'rotate-180 text-emerald-500' : textMuted}\`} /></div>`
);

content = content.replace(
  /{isLaborExpanded \? <ChevronUp className="w-4 h-4" \/> : <ChevronDown className="w-4 h-4" \/>}/,
  `<div className={\`p-2 rounded-full transition-colors \${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}\`}><ChevronDown className={\`w-5 h-5 transition-transform duration-300 \${isLaborExpanded ? 'rotate-180 text-indigo-500' : textMuted}\`} /></div>`
);

content = content.replace(
  /{isOpexExpanded \? <ChevronUp className="w-4 h-4" \/> : <ChevronDown className="w-4 h-4" \/>}/,
  `<div className={\`p-2 rounded-full transition-colors \${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}\`}><ChevronDown className={\`w-5 h-5 transition-transform duration-300 \${isOpexExpanded ? 'rotate-180 text-blue-500' : textMuted}\`} /></div>`
);

// Beautify inputs inside detailed fields
content = content.replace(
  /className={\`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all \${inputBg}\`}/g,
  `className={\`w-full pl-10 pr-3 py-3 md:py-2.5 text-sm md:text-base font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 \${inputBg}\`}`
);
content = content.replace(
  /className={\`w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all \${inputBg}\`}/g,
  `className={\`w-full px-4 py-3 md:py-2.5 text-sm md:text-base font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 \${inputBg}\`}`
);

// Enhance summary borders & text
content = content.replace(
  /<div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">/g,
  `<div className="mt-6 pt-5 border-t border-dashed border-slate-300 dark:border-slate-600 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 -mx-5 -mb-5 px-5 py-4 rounded-b-3xl">`
);

content = content.replace(
  /<span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">/g,
  `<span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">`
);

content = content.replace(
  /<span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">/g,
  `<span className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">`
);

content = content.replace(
  /<span className="text-lg font-bold text-blue-600 dark:text-blue-400">/g,
  `<span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">`
);

// Fix inner relative spans for "Rp"
content = content.replace(
  /className={\`absolute left-3 top-1\/2 -translate-y-1\/2 text-xs font-normal \${textMuted}\`}/g,
  `className={\`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium \${textMuted}\`}`
);


fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', content);
INNER_EOF
node /tmp/patch.js
