const fs = require('fs');
let content = fs.readFileSync('src/components/SmartInvestmentFormEngine.tsx', 'utf8');

// Un-bold everything
content = content.replace(/font-extrabold/g, 'font-normal');
content = content.replace(/font-bold/g, 'font-normal');
content = content.replace(/font-semibold/g, 'font-normal');
content = content.replace(/font-medium/g, 'font-normal');

// Shrink font sizes
content = content.replace(/\btext-2xl\b/g, 'text-xl');
content = content.replace(/\btext-xl\b/g, 'text-lg');
content = content.replace(/\btext-lg\b/g, 'text-base');
content = content.replace(/\btext-base\b/g, 'text-sm');
content = content.replace(/\btext-sm\b/g, 'text-xs');

fs.writeFileSync('src/components/SmartInvestmentFormEngine.tsx', content);
console.log("Done fixing fonts in SmartInvestmentFormEngine");
