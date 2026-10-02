const fs = require('fs');
let code = fs.readFileSync('src/components/mpp/TenantDashboard.tsx', 'utf8');

const regex = /                              <td className="p-4 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">\n                                \{slaDuration\}\n                              <\/td>\n                              <td className="p-4">\n                                <div className="font-bold text-slate-800 dark:text-slate-200">\{rq\.citizen\?\.full_name \|\| 'Pemohon MPP'\}<\/div>\n                                <div className="text-\[10px\] text-slate-500 font-mono mt-0\.5">\{rq\.citizen\?\.nik \|\| rq\.citizen_nik\}<\/div>\n                              <\/td>\n                              <td className="p-4">\n                                <div className="text-slate-700 dark:text-slate-300 max-w-\[200px\] truncate" title=\{rq\.service\?\.service_name\}>\n                                  \{rq\.service\?\.service_name \|\| '-'\}\n                                <\/div>\n                              <\/td>/;

code = code.replace(regex, `                              <td className="p-4 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">\n                                {slaDuration}\n                              </td>`);

fs.writeFileSync('src/components/mpp/TenantDashboard.tsx', code);
console.log('fixed table cols');
