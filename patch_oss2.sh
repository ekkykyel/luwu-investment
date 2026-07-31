cat << 'INNER_EOF' > /tmp/patch_oss2.js
const fs = require('fs');
let content = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

content = content.replace(
  /<span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">\s*Gunakan Standar OSS \/ Odoo\s*<\/span>/,
  `<div className="flex flex-col"><span className="text-sm md:text-base font-bold text-emerald-700 dark:text-emerald-300">Gunakan Standar OSS / Odoo</span><span className="text-[10px] md:text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Kalkulasi rinci (CAPEX, OPEX, Naker)</span></div>`
);

content = content.replace(
  /<Settings2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" \/>/,
  `<div className="p-2 md:p-2.5 rounded-xl bg-emerald-500/20 dark:bg-emerald-400/20 mr-1"><Settings2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" /></div>`
);

fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', content);
INNER_EOF
node /tmp/patch_oss2.js
