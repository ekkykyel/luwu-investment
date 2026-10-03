const fs = require('fs');
let code = fs.readFileSync('src/components/PortalMPP.tsx', 'utf8');

// Line 2336 and 2337: Wadah Grafik Chart Area
code = code.replace(
  /<div className="max-w-6xl mx-auto mt-8 sm:mt-12 w-full">/g,
  '<div className="max-w-6xl mx-auto mt-8 sm:mt-12 w-full overflow-hidden">'
);

code = code.replace(
  /className="w-full bg-white\/80 dark:bg-slate-800\/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900\/5 dark:shadow-emerald-900\/20 p-6 sm:p-8 md:p-10 border border-slate-100 dark:border-white\/5 flex flex-col"/g,
  'className="w-full overflow-hidden bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 p-6 sm:p-8 md:p-10 border border-slate-100 dark:border-white/5 flex flex-col"'
);

// Line 2511: Kartu Grafik (Kepuasan Masyarakat)
code = code.replace(
  /className="lg:col-span-8 bg-white\/80 dark:bg-slate-800\/40 backdrop-blur-xl border border-slate-100 dark:border-white\/5 rounded-3xl shadow-lg shadow-emerald-900\/5 dark:shadow-emerald-900\/20 p-6 sm:p-8 flex flex-col justify-center"/g,
  'className="lg:col-span-8 w-full overflow-hidden bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 p-6 sm:p-8 flex flex-col justify-center"'
);

fs.writeFileSync('src/components/PortalMPP.tsx', code);
