cat << 'INNER_EOF' > /tmp/patch_oss.js
const fs = require('fs');
let oss = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

// For detailed forms padding
oss = oss.replace(
  /className={\`p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all/g,
  'className={`p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all'
);

// For the total bar negative margin
oss = oss.replace(
  /-mx-4 sm:-mx-5 md:-mx-6 -mb-4 sm:-mb-5 md:-mb-6 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl/g,
  '-mx-3 sm:-mx-5 md:-mx-6 -mb-3 sm:-mb-5 md:-mb-6 px-3 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl'
);

fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', oss);
INNER_EOF
node /tmp/patch_oss.js
