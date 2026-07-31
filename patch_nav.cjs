const fs = require('fs');
function patch(file, matchFuncStr) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const navigate = useNavigate();')) return;
  if (!content.includes('react-router-dom')) {
    content = content.replace(/import React/, 'import { useNavigate } from "react-router-dom";\nimport React');
  } else if (!content.includes('useNavigate')) {
    content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];/, (match, p1) => {
      return `import { ${p1.trim()}, useNavigate } from "react-router-dom";`;
    });
  }
  content = content.replace(matchFuncStr, matchFuncStr + '\n  const navigate = useNavigate();\n');
  content = content.replace(/window\.location\.href\s*=\s*(["'`])([^"'`]+)\1;?/g, 'navigate($1$2$1);');
  fs.writeFileSync(file, content);
  console.log('patched ' + file);
}

patch('src/components/LandingPage.tsx', 'export default function LandingPage({\n  onEnter,\n  investments = [],\n  districts = [],\n  villages = [],\n  infrastructure = [],\n  zonasiData = []\n}: LandingPageProps) {');
patch('src/components/Auth/InvestorRegistrationForm.tsx', 'const InvestorRegistrationForm: React.FC = () => {');
patch('src/components/Auth/InvestorLogin.tsx', 'const InvestorLogin: React.FC = () => {');
patch('src/components/Dashboard/AdminPortalDashboard.tsx', 'const AdminPortalDashboard: React.FC = () => {');
patch('src/components/Dashboard/InvestorPortalDashboard.tsx', 'const InvestorPortalDashboard: React.FC = () => {');
patch('src/components/Dashboard/MasyarakatDashboard.tsx', 'const MasyarakatDashboard: React.FC = () => {');

