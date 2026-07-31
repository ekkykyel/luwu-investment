cat << 'INNER_EOF' > /tmp/patch_input_padding.js
const fs = require('fs');
let oss = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

// For large inputs
oss = oss.replace(
  /className={\`w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 min-h-\[48px\] sm:min-h-\[52px\] rounded-2xl border font-bold text-base sm:text-lg/g,
  'className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px] rounded-2xl border font-bold text-base sm:text-lg'
);

// For small inputs inside detailed section
oss = oss.replace(
  /className={\`w-full pl-9 sm:pl-10 pr-3 py-2\.5 md:py-3 text-\[13px\] sm:text-sm md:text-base font-semibold/g,
  'className={`w-full pl-8 sm:pl-9 pr-2 sm:pr-3 py-2.5 md:py-3 text-[13px] sm:text-sm md:text-base font-semibold'
);
oss = oss.replace(
  /className={\`w-full px-3 sm:px-4 py-2\.5 md:py-3 text-\[13px\] sm:text-sm md:text-base font-semibold/g,
  'className={`w-full px-3 sm:px-4 py-2.5 md:py-3 text-[13px] sm:text-sm md:text-base font-semibold'
);

// Inner Rp label left padding
oss = oss.replace(
  /className={\`absolute left-4 sm:left-5 top-1\/2/g,
  'className={`absolute left-3 sm:left-4 top-1/2'
);
oss = oss.replace(
  /className={\`absolute left-3 top-1\/2 -translate-y-1\/2 text-\[13px\] sm:text-sm font-medium \${textMuted}\`}/g,
  'className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[12px] sm:text-[13px] font-medium ${textMuted}`}'
);

fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', oss);
INNER_EOF
node /tmp/patch_input_padding.js
