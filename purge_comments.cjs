const fs = require('fs');

const filesToClean = ['src/components/LandingPage.tsx', 'src/App.tsx', 'src/components/InvestorDashboard.tsx'];

filesToClean.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Using a regex to remove multi-line comments. 
    // We should be careful not to remove JSDoc or useful comments. The user said "massive blocks of commented-out code".
    // Usually these are long lines or multiple lines. Let's just remove all /* ... */ that are over e.g. 50 characters or span multiple lines.
    content = content.replace(/\/\*[\s\S]*?\*\//g, match => {
      // Keep small inline comments, remove big commented out blocks
      if (match.length > 50 || match.split('\\n').length > 2) {
        return '';
      }
      return match;
    });
    
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('Done purging comments');
