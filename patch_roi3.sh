node -e "
const fs = require('fs');
const files = [
  'src/components/Dashboard/AdminPortalDashboard.tsx',
  'src/components/Dashboard/InvestorPortalDashboard.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /<XAxis \n                            dataKey=\"rate\" \n                            stroke=\"#64748b\" \n                            tickLine=\{false\}\n                          \/>/g,
    '<XAxis \n                            dataKey=\"rate\" \n                            stroke=\"#64748b\" \n                            tickLine={false}\n                            tick={{ fill: \"#94a3b8\", fontSize: 12 }}\n                          />'
  );

  content = content.replace(
    /<YAxis \n                            stroke=\"#64748b\" \n                            tickLine=\{false\}\n                            label=\{\{ value: 'NPV \\(Juta Rp\\)', angle: -90, position: 'insideLeft', fill: '#64748b', style: \{ textAnchor: 'middle' \} \}\}\n                          \/>/g,
    '<YAxis \n                            stroke=\"#64748b\" \n                            tickLine={false}\n                            tick={{ fill: \"#94a3b8\", fontSize: 12 }}\n                            label={{ value: \\'NPV (Juta Rp)\\', angle: -90, position: \\'insideLeft\\', fill: \\'#64748b\\', style: { textAnchor: \\'middle\\' } }}\n                          />'
  );

  fs.writeFileSync(file, content);
}
console.log('patched axes');
"
