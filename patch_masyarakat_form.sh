node -e "
const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', 'utf8');

// Widening the columns
content = content.replace(/lg:col-span-5/g, 'lg:col-span-6');
content = content.replace(/lg:col-span-7/g, 'lg:col-span-6');

// Adjusting sizes inside the form (rough regexes)
// Let's replace classes directly in the relevant portion (e.g. between '<form onSubmit={handleSubmit}' and '</form>')
const formStartIndex = content.indexOf('<form onSubmit={handleSubmit}');
const formEndIndex = content.indexOf('</form>', formStartIndex);

if (formStartIndex !== -1 && formEndIndex !== -1) {
  let formContent = content.substring(formStartIndex, formEndIndex);
  
  // Font sizes & paddings replacements for 'lebih lega' (more spacious/readable)
  formContent = formContent.replace(/text-xs/g, 'text-sm');
  formContent = formContent.replace(/text-\\[10px\\]/g, 'text-xs');
  formContent = formContent.replace(/text-sm/g, 'text-base');
  
  // For select/inputs
  formContent = formContent.replace(/px-3 py-2\.5/g, 'px-4 py-3');
  formContent = formContent.replace(/p-2\.5/g, 'p-3');
  formContent = formContent.replace(/min-h-\\[48px\\]/g, 'min-h-[52px]');
  formContent = formContent.replace(/min-h-\\[52px\\]/g, 'min-h-[56px]');
  formContent = formContent.replace(/space-y-4/g, 'space-y-6'); // increase spacing between form groups
  formContent = formContent.replace(/mb-1\.5/g, 'mb-2');

  content = content.substring(0, formStartIndex) + formContent + content.substring(formEndIndex);
}

fs.writeFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', content);
console.log('patched masyarakat dashboard form');
"
