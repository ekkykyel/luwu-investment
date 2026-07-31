const fs = require('fs');
let content = fs.readFileSync('src/components/Auth/InvestorLogin.tsx', 'utf8');

const useStates = `
  const [loginRole, setLoginRole] = useState('investor');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
`;

content = content.replace(useStates, '');

const insertTarget = `  const [isFullscreen, setIsFullscreen] = useState(false);`;

content = content.replace(insertTarget, insertTarget + '\n' + useStates);

fs.writeFileSync('src/components/Auth/InvestorLogin.tsx', content);
console.log('fixed order');
