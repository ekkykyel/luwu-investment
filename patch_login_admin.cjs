const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
content = content.replace(/Login Admin/g, '{t("nav.loginAdmin", "Login Admin")}');
fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('patched Login Admin');
