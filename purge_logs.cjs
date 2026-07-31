const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const allFiles = getFiles('src');
allFiles.push('server.ts');

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace line completely if it only contains console.log/warn or alert
  content = content.replace(/^[ \t]*(console\.(log|warn)|alert)\s*\([^;]*\)[;\s]*$/gm, '');
  
  // Replace inline occurrences
  content = content.replace(/(console\.(log|warn)|alert)\s*\([^;]*\);?/g, '/* debug removed */');
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Done purging logs');
