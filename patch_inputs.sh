cat << 'INNER_EOF' > /tmp/patch_inputs.js
const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Replace standard simple inputs
content = content.replace(
  /className={\`w-full pl-14 pr-5 py-4 min-h-\[44px\] rounded-xl border font-medium text-lg outline-none transition-all \${inputBg}\`}/g,
  `className={\`w-full pl-14 pr-5 py-4 min-h-[52px] rounded-2xl border font-bold text-lg outline-none transition-all focus:ring-4 focus:ring-emerald-500/20 \${inputBg}\`}`
);

// Replace generic inputs
content = content.replace(
  /className={\`w-full px-5 py-4 min-h-\[44px\] rounded-xl border font-medium text-lg outline-none transition-all \${inputBg}\`}/g,
  `className={\`w-full px-5 py-4 min-h-[52px] rounded-2xl border font-bold text-lg outline-none transition-all focus:ring-4 focus:ring-emerald-500/20 \${inputBg}\`}`
);


// Same for select
content = content.replace(
  /className={\`w-full px-5 py-4 min-h-\[44px\] rounded-xl border font-medium text-lg outline-none transition-all appearance-none cursor-pointer \${inputBg}\`}/g,
  `className={\`w-full px-5 py-4 min-h-[52px] rounded-2xl border font-bold text-lg outline-none transition-all appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/20 \${inputBg}\`}`
);


fs.writeFileSync('src/components/LandingPage.tsx', content);
INNER_EOF
node /tmp/patch_inputs.js
