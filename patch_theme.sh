cat << 'INNER_EOF' > /tmp/patch_theme.js
const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /const \[isDarkMode, setIsDarkMode\] = useState<boolean>\(true\);/g,
  'const [isDarkMode, setIsDarkMode] = useState<boolean>(false);'
);

fs.writeFileSync('src/App.tsx', app);
INNER_EOF
node /tmp/patch_theme.js
