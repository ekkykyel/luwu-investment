const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');
const injection = `
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || '';
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('AJAXError')
  ) {
    event.preventDefault(); // Prevent the error overlay
  }
});
`;
code = code.replace("window.addEventListener('vite:preloadError', () => {", injection + "\nwindow.addEventListener('vite:preloadError', () => {");
fs.writeFileSync('src/main.tsx', code);
