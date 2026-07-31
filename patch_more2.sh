node -e "
const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', 'utf8');

const formStartIndex = content.indexOf('<form onSubmit={handleSubmit}');
const formEndIndex = content.indexOf('</form>', formStartIndex);

if (formStartIndex !== -1 && formEndIndex !== -1) {
  let formContent = content.substring(formStartIndex, formEndIndex);
  
  formContent = formContent.replace(/text-\\[9px\\]/g, 'text-[11px]');
  
  content = content.substring(0, formStartIndex) + formContent + content.substring(formEndIndex);
}

fs.writeFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', content);
console.log('patched even more');
"
