cat << 'INNER_EOF' > /tmp/patch_layout.js
const fs = require('fs');
let lp = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Fix ROI section container and card
lp = lp.replace(
  /className="lg:col-span-12 p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-\[2rem\] border h-full flex flex-col/g,
  'className="lg:col-span-12 p-3 sm:p-6 md:p-8 rounded-2xl md:rounded-[2rem] border h-full flex flex-col'
);

lp = lp.replace(
  /className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 border-b pb-5 sm:pb-6/g,
  'className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 mb-6 md:mb-8 border-b pb-5 md:pb-6'
);

lp = lp.replace(
  /{roiResult && \(\s*<div className={\`ml-auto/g,
  '{roiResult && (<div className={`mt-3 md:mt-0 w-full md:w-auto flex md:inline-flex justify-center md:ml-auto'
);

// We need to also check the container of the section
// It is: <div className="container max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
lp = lp.replace(
  /<div className="container max-w-7xl mx-auto px-4 lg:px-6 relative z-10">/g,
  '<div className="container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">'
);

fs.writeFileSync('src/components/LandingPage.tsx', lp);

let oss = fs.readFileSync('src/components/OssRoiSimulatorInputs.tsx', 'utf8');

// Fix CAPEX overlapping texts
oss = oss.replace(
  /<div className="flex justify-between items-center mb-2">/g,
  '<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">'
);

// Fix Detailed Form headers overlapping
oss = oss.replace(
  /<div className="flex items-center gap-2">/g,
  '<div className="flex flex-row items-center gap-2 flex-wrap">'
);

// Fix Total bar in CAPEX overlapping
oss = oss.replace(
  /<div className="mt-6 pt-5 border-t border-dashed border-slate-300 dark:border-slate-600 flex justify-between items-center/g,
  '<div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-dashed border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0'
);

fs.writeFileSync('src/components/OssRoiSimulatorInputs.tsx', oss);

INNER_EOF
node /tmp/patch_layout.js
