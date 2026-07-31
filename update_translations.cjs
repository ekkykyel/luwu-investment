const fs = require('fs');

function updateLocale(file, data) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!content.auth) content.auth = {};
  Object.assign(content.auth, data);
  
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

updateLocale('src/locales/id.json', {
  subtitleMasyarakat: 'Masyarakat/Publik',
  subtitleInvestor: 'Investor/Mitra Bisnis',
  subtitleAdmin: 'Admin OSS, Admin Dalak, Admin Data & Admin Promosi',
  loginAs: 'Masuk Sebagai',
  roleDalak: 'Admin - Bidang Dalak',
  rolePromosi: 'Admin - Bidang Promosi',
  roleOss: 'Admin - Bidang Perizinan (OSS)',
  roleData: 'Admin - Perencanaan & Data',
  nikLabel: 'Nomor Induk Kependudukan (NIK)',
  emailLabel: 'Alamat Email',
  nikPlaceholder: 'Masukkan 16 digit NIK...',
  emailPlaceholder: 'email@domain.com',
  nikError: 'NIK harus berupa 16 digit angka'
});

updateLocale('src/locales/en.json', {
  subtitleMasyarakat: 'Public / Citizens',
  subtitleInvestor: 'Investor / Business Partner',
  subtitleAdmin: 'OSS Admin, Dalak Admin, Data Admin & Promotion Admin',
  loginAs: 'Login As',
  roleDalak: 'Admin - Dalak Division',
  rolePromosi: 'Admin - Promotion Division',
  roleOss: 'Admin - Licensing Division (OSS)',
  roleData: 'Admin - Planning & Data',
  nikLabel: 'National Identity Number (NIK)',
  emailLabel: 'Email Address',
  nikPlaceholder: 'Enter 16 digit NIK...',
  emailPlaceholder: 'email@domain.com',
  nikError: 'NIK must be 16 digits'
});

updateLocale('src/locales/zh.json', {
  subtitleMasyarakat: '公众 / 公民',
  subtitleInvestor: '投资者 / 商业伙伴',
  subtitleAdmin: 'OSS管理员、Dalak管理员、数据管理员与推广管理员',
  loginAs: '登录身份',
  roleDalak: '管理员 - Dalak部门',
  rolePromosi: '管理员 - 推广部门',
  roleOss: '管理员 - 许可部门 (OSS)',
  roleData: '管理员 - 规划与数据',
  nikLabel: '国家身份证号码 (NIK)',
  emailLabel: '电子邮件地址',
  nikPlaceholder: '输入16位身份证号码...',
  emailPlaceholder: 'email@domain.com',
  nikError: '身份证号码必须为16位数字'
});

console.log('Locales updated with auth strings');
