const fs = require('fs');
let code = fs.readFileSync('src/components/mpp/TenantDashboard.tsx', 'utf8');
code = code.replace(/      \)\}\n\n      \)\}\n\n      \{\/\* MOBILE BOTTOM/g, '      )}\n\n      {/* MOBILE BOTTOM');
fs.writeFileSync('src/components/mpp/TenantDashboard.tsx', code);
