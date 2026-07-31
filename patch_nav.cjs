const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Remove { name: t("nav.simulasi"), id: "analytics-section" },
content = content.replace(/\{\s*name:\s*t\("nav\.simulasi"\),\s*id:\s*"analytics-section"\s*\},/g, '');

// Update PELAJARI POTENSI button style
const oldLearnPotentialBtn = `className={\`px-8 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 ease-out flex items-center justify-center gap-2.5 group \${isDark ? "border-slate-600/80 bg-slate-800/50 text-slate-200 hover:bg-slate-700/80 hover:border-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-slate-300/80 bg-white/80 text-slate-700 hover:bg-white hover:border-emerald-400 hover:text-emerald-700 hover:shadow-[0_6px_25px_rgba(16,185,129,0.15)]"}\`}`;
const newLearnPotentialBtn = `className={\`px-8 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 ease-out flex items-center justify-center gap-2.5 group bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] hover:-translate-y-0.5 border-emerald-400/40\`}`;

content = content.replace(oldLearnPotentialBtn, newLearnPotentialBtn);

// Also let's find the LOGIN INVESTOR button and make it gradient. 
// Wait, the user said: "warna tombol : LOGIN INVESTOR buat warna latar gradient"
// In the hero or in the navbar? The user probably means the login button on the top right.
fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('Landing page patched');
