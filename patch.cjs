const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');
code = code.replace(
  "  if (typeof args[0] === 'string' && (",
  "  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');\n  if (\n      msg.includes('AJAXError: Failed to fetch (0)') || \n      msg.includes('error 0: Failed to fetch') ||\n      msg.includes('Failed to fetch') ||\n      msg.includes('Could not create web worker(s)') ||\n      msg.includes('Error loading testimonials from Supabase') ||\n      (typeof args[0] === 'string' && args[0].includes('error 0: AJAXError')) ||\n      (typeof args[0] === 'string' && args[0].includes('error 1: AJAXError')) ||\n      (typeof args[0] === 'string' && args[0].includes('error 2: AJAXError')) ||\n      (typeof args[0] === 'string' && args[0].includes('error 3: AJAXError')) ||\n      (typeof args[0] === 'string' && args[0].includes('error 4: AJAXError')) ||\n      (typeof args[0] === 'string' && args[0].includes('error 5: AJAXError'))\n  ) {\n    return;\n  }\n  if (false && ("
);
fs.writeFileSync('src/main.tsx', code);
