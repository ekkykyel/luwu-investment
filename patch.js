const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');
code = code.replace(
  `  if (typeof args[0] === 'string' && (
      args[0].includes('AJAXError: Failed to fetch (0)') || 
      args[0].includes('error 0: Failed to fetch') ||
      args[0].includes('Failed to fetch') ||
      args[0].includes('Could not create web worker(s)') ||
      args[0].includes('Error loading testimonials from Supabase')
  )) {
    // Ignore benign Maplibre fetch cancellation and Monaco worker errors
    return;
  }`,
  `  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (
      msg.includes('AJAXError: Failed to fetch (0)') || 
      msg.includes('error 0: Failed to fetch') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Could not create web worker(s)') ||
      msg.includes('Error loading testimonials from Supabase') ||
      (typeof args[0] === 'string' && args[0].includes('error 0: AJAXError'))
  ) {
    // Ignore benign Maplibre fetch cancellation and Monaco worker errors
    return;
  }`
);
fs.writeFileSync('src/main.tsx', code);
