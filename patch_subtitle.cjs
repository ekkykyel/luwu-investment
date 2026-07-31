const fs = require('fs');
let content = fs.readFileSync('src/components/Auth/InvestorLogin.tsx', 'utf8');

const oldStr = `{loginRole === 'masyarakat' 
            ? 'Portal Autentikasi Pengaduan Masyarakat' 
            : t('auth.portalSubtitle', 'Admin OSS, Admin Dalak, & Admin Promosi')}`;

const newStr = `{loginRole === 'masyarakat' 
            ? 'Masyarakat/Publik' 
            : loginRole === 'investor'
            ? 'Investor/Mitra Bisnis'
            : 'Admin OSS, Admin Dalak, Admin Data & Admin Promosi'}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/components/Auth/InvestorLogin.tsx', content);
console.log('subtitle patched');
