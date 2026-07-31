cat << 'INNER_EOF' > /tmp/patch_landing.js
const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// I will find the div encapsulating OssRoiSimulatorInputs and ensure it has nice padding on mobile.
content = content.replace(
  /<div className="md:col-span-2">/g,
  `<div className="md:col-span-2 space-y-6">`
);

fs.writeFileSync('src/components/LandingPage.tsx', content);
INNER_EOF
node /tmp/patch_landing.js
