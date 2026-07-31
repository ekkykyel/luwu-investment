const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove handleAutoFullscreenGesture definition
const regexDefinition = /\/\/ Auto-fullscreen on user gesture ONLY.*?const handleAutoFullscreenGesture = \(\) => \{.*?requestSmartFullscreen\(\);\s*\}\s*\};\s*/s;
content = content.replace(regexDefinition, '');

// Remove event listeners
content = content.replace(/\/\/ Capture user touch\/click events globally across all menus to trigger auto-fullscreen on Android\s*/s, '');
content = content.replace(/window\.addEventListener\("click", handleAutoFullscreenGesture, \{ passive: true \}\);\s*/g, '');
content = content.replace(/window\.addEventListener\("touchstart", handleAutoFullscreenGesture, \{ passive: true \}\);\s*/g, '');
content = content.replace(/window\.removeEventListener\("click", handleAutoFullscreenGesture\);\s*/g, '');
content = content.replace(/window\.removeEventListener\("touchstart", handleAutoFullscreenGesture\);\s*/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log('patched App.tsx');
