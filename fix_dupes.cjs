const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// There are duplicate imports (e.g. Map, Plus, UserPlus) in the lucide-react block.
// The easiest way is to match the entire import block and rebuild it cleanly using a Set.
const match = code.match(/import\s+{([^}]+)}\s+from\s+["']lucide-react["'];/);
if(match) {
  const importsList = match[1].split(',').map(s => s.trim()).filter(Boolean);
  const uniqueImports = [...new Set(importsList)];
  
  const newImportStr = "import {\n  " + uniqueImports.join(",\n  ") + "\n} from 'lucide-react';";
  const newCode = code.replace(match[0], newImportStr);
  
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Fixed duplicate imports");
}
