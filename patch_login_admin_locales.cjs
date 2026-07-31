const fs = require('fs');

function updateLocale(file, label) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  content.nav.loginAdmin = label;
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

updateLocale('src/locales/id.json', 'Login Admin');
updateLocale('src/locales/en.json', 'Admin Login');
updateLocale('src/locales/zh.json', '管理员登录');
