const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /<motion\.div\s*initial="hidden"\s*animate="visible"\s*variants=\{\{\s*hidden: \{ opacity: 0 \},\s*visible: \{\s*opacity: 1,\s*transition: \{ staggerChildren: 0\.2, delayChildren: 0\.3 \}\s*\}\s*\}\}\s*className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"\s*>[\s\S]*?<\/motion\.div>/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  console.log("Removed hero buttons");
} else {
  console.log("Hero buttons not found");
}

fs.writeFileSync('src/components/LandingPage.tsx', content);
