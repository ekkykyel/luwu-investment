node -e "
const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', 'utf8');

const formStartIndex = content.indexOf('<form onSubmit={handleSubmit}');
const formEndIndex = content.indexOf('</form>', formStartIndex);

if (formStartIndex !== -1 && formEndIndex !== -1) {
  let formContent = content.substring(formStartIndex, formEndIndex);
  
  formContent = formContent.replace(/rows=\{4\}/g, 'rows={6}');
  // let's also make the submit button more prominent
  formContent = formContent.replace(/py-3/g, 'py-4');
  
  content = content.substring(0, formStartIndex) + formContent + content.substring(formEndIndex);
}

fs.writeFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', content);
console.log('patched even more');
"
