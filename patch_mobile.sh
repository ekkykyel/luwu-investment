cat << 'INNER_EOF' > /tmp/patch_mobile.js
const fs = require('fs');

// 1. Update LandingPage.tsx
let lp = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Container padding for ROI simulator card
lp = lp.replace(
  /className="lg:col-span-12 p-6 md:p-8 rounded-\[2rem\] border h-full flex flex-col/g,
  'className="lg:col-span-12 p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-[2rem] border h-full flex flex-col'
);

// Form selects and inputs
lp = lp.replace(
  /className={\`w-full px-5 py-4 min-h-\[52px\] rounded-2xl border font-bold text-lg/g,
  'className={`w-full px-4 sm:px-5 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px] rounded-2xl border font-bold text-base sm:text-lg'
);
lp = lp.replace(
  /className={\`w-full pl-14 pr-5 py-4 min-h-\[52px\] rounded-2xl border font-bold text-lg/g,
  'className={`w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px] rounded-2xl border font-bold text-base sm:text-lg'
);

// Inner spacings
lp = lp.replace(
  /className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 border-b pb-6/g,
  'className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 border-b pb-5 sm:pb-6'
);

fs.writeFileSync('src/components/LandingPage.tsx', lp);

// 2. Update OssRoiSimulatorInputs.tsx
let oss = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

// Switch container
oss = oss.replace(
  /className={\`flex items-center justify-between p-4 rounded-2xl border/g,
  'className={`flex items-start sm:items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border'
);

oss = oss.replace(
  /<div className="flex flex-col"><span className="text-sm md:text-base font-bold/g,
  '<div className="flex flex-col mt-0.5 sm:mt-0"><span className="text-sm md:text-base font-bold leading-tight mb-0.5'
);
oss = oss.replace(
  /<span className="text-\[10px\] md:text-xs font-medium text-emerald-600\/70/g,
  '<span className="text-[11px] md:text-xs leading-tight font-medium text-emerald-600/70'
);

// Simple form inputs
oss = oss.replace(
  /className={\`w-full pl-14 pr-5 py-4 min-h-\[52px\] rounded-2xl border font-bold text-lg/g,
  'className={`w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px] rounded-2xl border font-bold text-base sm:text-lg'
);

oss = oss.replace(
  /className={\`absolute left-5 top-1\/2/g,
  'className={`absolute left-4 sm:left-5 top-1/2'
);

// Detailed form containers
oss = oss.replace(
  /className={\`p-5 md:p-6 rounded-3xl border transition-all/g,
  'className={`p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all'
);

// Input font sizes and paddings in detailed form
oss = oss.replace(
  /className={\`w-full pl-10 pr-3 py-3 md:py-2.5 text-sm md:text-base font-semibold/g,
  'className={`w-full pl-9 sm:pl-10 pr-3 py-2.5 md:py-3 text-[13px] sm:text-sm md:text-base font-semibold'
);
oss = oss.replace(
  /className={\`w-full px-4 py-3 md:py-2.5 text-sm md:text-base font-semibold/g,
  'className={`w-full px-3 sm:px-4 py-2.5 md:py-3 text-[13px] sm:text-sm md:text-base font-semibold'
);

// Fix inner Rp labels
oss = oss.replace(
  /className={\`absolute left-3 top-1\/2 -translate-y-1\/2 text-sm font-medium \${textMuted}\`}/g,
  'className={`absolute left-3 top-1/2 -translate-y-1/2 text-[13px] sm:text-sm font-medium ${textMuted}`}'
);

// Total bar
oss = oss.replace(
  /<div className="mt-6 pt-5 border-t border-dashed border-slate-300 dark:border-slate-600 flex justify-between items-center bg-slate-50\/50 dark:bg-slate-800\/30 -mx-5 -mb-5 px-5 py-4 rounded-b-3xl">/g,
  '<div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-dashed border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 bg-slate-50/50 dark:bg-slate-800/30 -mx-4 sm:-mx-5 md:-mx-6 -mb-4 sm:-mb-5 md:-mb-6 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl">'
);

oss = oss.replace(
  /<span className="text-xl md:text-2xl font-black/g,
  '<span className="text-lg sm:text-xl md:text-2xl font-black'
);

// Text wrapping adjustments for section headers
oss = oss.replace(
  /Rincian CAPEX \(Modal Awal\)/g,
  'Rincian CAPEX'
);
oss = oss.replace(
  /Estimasi Tenaga Kerja \(TKA & TKL\)/g,
  'Biaya Tenaga Kerja'
);
oss = oss.replace(
  /Rincian OPEX \(Operasional\)/g,
  'Rincian OPEX'
);

// Make the business scale badge responsive
oss = oss.replace(
  /<span className={\`ml-2 px-2 py-0.5 rounded-full text-\[10px\] font-bold uppercase tracking-wider/g,
  '<span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider'
);

fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', oss);
INNER_EOF
node /tmp/patch_mobile.js
