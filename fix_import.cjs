const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const match = code.match(/import\s+{([^}]+)}\s+from\s+["']lucide-react["'];/);
if(match) {
  let imports = match[1];
  if(!imports.includes('Ticket')) {
     imports = imports.trim() + ', Ticket';
  }
  if(!imports.includes('UserPlus')) {
     imports = imports.trim() + ', UserPlus';
  }
  const newCode = code.replace(match[0], "import { " + imports + " } from 'lucide-react';");
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Replaced using regex");
} else {
  console.log("Could not find lucide-react import");
}
