node -e "
const fs = require('fs');
const files = [
  'src/components/Dashboard/AdminPortalDashboard.tsx',
  'src/components/Dashboard/InvestorPortalDashboard.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Change tooltip of Sensitivity chart
  content = content.replace(
    /<Tooltip\s+contentStyle=\{\{\s*backgroundColor:\s*['\"]#0f172a['\"],\s*borderColor:\s*['\"]#334155['\"],\s*borderRadius:\s*['\"]12px['\"]\s*\}\}/g,
    '<Tooltip\n                            contentStyle={{ backgroundColor: \"#020617\", borderColor: \"rgba(16, 185, 129, 0.3)\", borderRadius: \"12px\" }}'
  );

  // Change XAxis and YAxis
  content = content.replace(
    /<XAxis \n                            dataKey=\"name\"\n                            stroke=\"#64748b\" \n                            tickLine=\{false\}\n                          \/>/g,
    '<XAxis \n                            dataKey=\"name\"\n                            stroke=\"#64748b\" \n                            tickLine={false}\n                            tick={{ fill: \"#94a3b8\", fontSize: 12 }}\n                          />'
  );

  content = content.replace(
    /<YAxis \n                            stroke=\"#64748b\" \n                            tickLine=\{false\}\n                            label=\{\{ value: 'NPV \(Juta Rp\)', angle: -90, position: 'insideLeft', fill: '#64748b', style: \{ textAnchor: 'middle' \} \}\}\n                          \/>/g,
    '<YAxis \n                            stroke=\"#64748b\" \n                            tickLine={false}\n                            tick={{ fill: \"#94a3b8\", fontSize: 12 }}\n                            label={{ value: \\'NPV (Juta Rp)\\', angle: -90, position: \\'insideLeft\\', fill: \\'#64748b\\', style: { textAnchor: \\'middle\\' } }}\n                          />'
  );

  // Trigger Sync
  if (!content.includes('// ui polish: executive premium fin-tech polish')) {
    content += '\n// ui polish: executive premium fin-tech polish\n';
  }

  fs.writeFileSync(file, content);
}
console.log('done');
"
