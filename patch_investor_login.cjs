const fs = require('fs');
let content = fs.readFileSync('src/components/Auth/InvestorLogin.tsx', 'utf8');

const replacements = [
  {
    from: "           setError('NIK harus berupa 16 digit angka');",
    to: "           setError(t('auth.nikError', 'NIK harus berupa 16 digit angka'));"
  },
  {
    from: `{loginRole === 'masyarakat' 
            ? 'Masyarakat/Publik' 
            : loginRole === 'investor'
            ? 'Investor/Mitra Bisnis'
            : 'Admin OSS, Admin Dalak, Admin Data & Admin Promosi'}`,
    to: `{loginRole === 'masyarakat' 
            ? t('auth.subtitleMasyarakat', 'Masyarakat/Publik') 
            : loginRole === 'investor'
            ? t('auth.subtitleInvestor', 'Investor/Mitra Bisnis')
            : t('auth.subtitleAdmin', 'Admin OSS, Admin Dalak, Admin Data & Admin Promosi')}`
  },
  {
    from: `<label className="block text-sm font-medium text-slate-300 mb-1.5">Masuk Sebagai</label>`,
    to: `<label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.loginAs', 'Masuk Sebagai')}</label>`
  },
  {
    from: `<option value="admin_dalak">Admin - Bidang Dalak</option>
                <option value="admin_promosi">Admin - Bidang Promosi</option>
                <option value="admin_oss">Admin - Bidang Perizinan (OSS)</option>
                <option value="admin_data">Admin - Perencanaan & Data</option>`,
    to: `<option value="admin_dalak">{t('auth.roleDalak', 'Admin - Bidang Dalak')}</option>
                <option value="admin_promosi">{t('auth.rolePromosi', 'Admin - Bidang Promosi')}</option>
                <option value="admin_oss">{t('auth.roleOss', 'Admin - Bidang Perizinan (OSS)')}</option>
                <option value="admin_data">{t('auth.roleData', 'Admin - Perencanaan & Data')}</option>`
  },
  {
    from: `{loginRole === 'masyarakat' ? 'Nomor Induk Kependudukan (NIK)' : 'Alamat Email'}`,
    to: `{loginRole === 'masyarakat' ? t('auth.nikLabel', 'Nomor Induk Kependudukan (NIK)') : t('auth.emailLabel', 'Alamat Email')}`
  },
  {
    from: `placeholder={loginRole === 'masyarakat' ? 'Masukkan 16 digit NIK...' : 'email@domain.com'}`,
    to: `placeholder={loginRole === 'masyarakat' ? t('auth.nikPlaceholder', 'Masukkan 16 digit NIK...') : t('auth.emailPlaceholder', 'email@domain.com')}`
  }
];

replacements.forEach(({from, to}) => {
  content = content.replace(from, to);
});

fs.writeFileSync('src/components/Auth/InvestorLogin.tsx', content);
console.log('InvestorLogin.tsx patched for i18n');
