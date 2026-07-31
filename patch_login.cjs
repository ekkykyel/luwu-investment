const fs = require('fs');
let content = fs.readFileSync('src/components/Auth/InvestorLogin.tsx', 'utf8');

// replace useState('investor') with dynamic initial state
content = content.replace(
  "const [loginRole, setLoginRole] = useState('investor');",
  `const [loginRole, setLoginRole] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'investor') return 'investor';
    if (roleParam === 'masyarakat') return 'masyarakat';
    return 'admin_dalak'; // default for admin
  });`
);

// update dropdown condition and options
const oldDropdown = `{new URLSearchParams(window.location.search).get('role') !== 'masyarakat' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Masuk Sebagai</label>
              <select
                value={loginRole}
                onChange={(e) => {
                  setLoginRole(e.target.value);
                  setIdentifier(''); // Reset input when changing roles
                }}
                className="block w-full pl-3 pr-10 py-2.5 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm appearance-none"
              >
                <option value="investor">Investor / Mitra Bisnis</option>
                <option value="masyarakat">Masyarakat Publik</option>
                <option value="admin_dalak">Admin - Bidang Dalak</option>
                <option value="admin_promosi">Admin - Bidang Promosi</option>
                <option value="admin_oss">Admin - Bidang Perizinan (OSS)</option>
                <option value="admin_data">Admin - Perencanaan & Data</option>
              </select>
            </div>
            )}`;

const newDropdown = `{new URLSearchParams(window.location.search).get('role') !== 'masyarakat' && new URLSearchParams(window.location.search).get('role') !== 'investor' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Masuk Sebagai</label>
              <select
                value={loginRole}
                onChange={(e) => {
                  setLoginRole(e.target.value);
                  setIdentifier(''); // Reset input when changing roles
                }}
                className="block w-full pl-3 pr-10 py-2.5 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm appearance-none"
              >
                <option value="admin_dalak">Admin - Bidang Dalak</option>
                <option value="admin_promosi">Admin - Bidang Promosi</option>
                <option value="admin_oss">Admin - Bidang Perizinan (OSS)</option>
                <option value="admin_data">Admin - Perencanaan & Data</option>
              </select>
            </div>
            )}`;

content = content.replace(oldDropdown, newDropdown);

fs.writeFileSync('src/components/Auth/InvestorLogin.tsx', content);
console.log('patched investor login');
