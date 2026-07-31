const fs = require('fs');
const path = require('path');

const files = [
  'src/components/Auth/InvestorRegistrationForm.tsx',
  'src/components/Auth/InvestorLogin.tsx',
  'src/components/Dashboard/AdminPortalDashboard.tsx',
  'src/components/Dashboard/InvestorPortalDashboard.tsx',
  'src/components/Dashboard/MasyarakatDashboard.tsx',
  'src/components/LandingPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add import if missing
  if (!content.includes('useNavigate') && content.includes('window.location.href =')) {
    if (content.includes('react-router-dom')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];/, (match, p1) => {
        return `import { ${p1.trim()}, useNavigate } from "react-router-dom";`;
      });
    } else {
      content = content.replace(/import React/, 'import { useNavigate } from "react-router-dom";\nimport React');
    }
    changed = true;
  }

  // Define component name and insert navigate
  const componentMatch = content.match(/export\s+(?:default\s+)?function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/);
  if (componentMatch) {
    const compName = componentMatch[1];
    if (!content.includes('const navigate = useNavigate();') && content.includes('window.location.href =')) {
      content = content.replace(componentMatch[0], `${componentMatch[0]}\n  const navigate = useNavigate();`);
      changed = true;
    }
  } else {
    // try finding const Component = () => {
    const arrowMatch = content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*(?:React\.FC<[^>]+>\s*)?=\s*\([^)]*\)\s*=>\s*{/);
    if(arrowMatch && !content.includes('const navigate = useNavigate();') && content.includes('window.location.href =')) {
      content = content.replace(arrowMatch[0], `${arrowMatch[0]}\n  const navigate = useNavigate();`);
      changed = true;
    }
  }

  // Replace window.location.href = "string" or 'string' or `string`
  const regex = /window\.location\.href\s*=\s*(["'`])([^"'`]+)\1;?/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'navigate($1$2$1);');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
