const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // import { ... } from './some/path';
            const importRegex = /from\s+['"](\.\/?[^'"]*|\.\.\/?[^'"]*)['"]/g;
            content = content.replace(importRegex, (match, p1) => {
                // Ignore if it's already got an extension that's standard
                if (p1 && !p1.match(/\.(js|jsx|ts|tsx|css|json|svg|png|jpg|jpeg|gif)$/i)) {
                    modified = true;
                    // we replace inside the original match string to not mess up quotes or `from` text
                    return match.replace(/['"].*['"]/, `"${p1}.js"`);
                }
                return match;
            });

            // import('./some/path')
            const dynamicImportRegex = /import\(['"](\.\/?[^'"]*|\.\.\/?[^'"]*)['"]\)/g;
            content = content.replace(dynamicImportRegex, (match, p1) => {
                if (p1 && !p1.match(/\.(js|jsx|ts|tsx|css|json|svg|png|jpg|jpeg|gif)$/i)) {
                    modified = true;
                    return match.replace(/['"].*['"]/, `"${p1}.js"`);
                }
                return match;
            });
            
             // export ... from ...
            const exportRegex = /export\s+.*?\s+from\s+['"](\.\/?[^'"]*|\.\.\/?[^'"]*)['"]/g;
            content = content.replace(exportRegex, (match, p1) => {
                 if (p1 && !p1.match(/\.(js|jsx|ts|tsx|css|json|svg|png|jpg|jpeg|gif)$/i)) {
                    modified = true;
                    return match.replace(/['"].*['"]/, `"${p1}.js"`);
                }
                return match;
            });


            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

try {
  processDir('src');
} catch (e) {
  console.log(e);
}
