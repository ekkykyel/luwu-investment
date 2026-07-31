cat << 'INNER_EOF' > /tmp/patch_tka.js
const fs = require('fs');
let oss = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

oss = oss.replace(
  /<div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">/,
  '<div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-dashed border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 bg-slate-50/50 dark:bg-slate-800/30 -mx-4 sm:-mx-5 md:-mx-6 -mb-4 sm:-mb-5 md:-mb-6 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl">'
);

oss = oss.replace(
  /<span className="text-sm font-semibold">Total Biaya Tenaga Kerja \/ Tahun:<\/span>/,
  '<span className="text-sm font-semibold">Total Biaya TK / Tahun:</span>'
);

fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', oss);
INNER_EOF
node /tmp/patch_tka.js
