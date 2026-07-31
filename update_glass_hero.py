import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

pattern = r'<motion\.div className="flex flex-col items-center text-center max-w-4xl mx-auto" style=\{\{ y: yText, opacity: opacityText \}\}>'
replacement = r'<motion.div className={`flex flex-col items-center text-center max-w-5xl mx-auto p-8 md:p-12 lg:p-16 rounded-[2.5rem] backdrop-blur-xl border shadow-2xl transition-all duration-700 ${isDark ? "bg-white/5 border-white/10 shadow-black/50" : "bg-white/40 border-white/40 shadow-emerald-900/5"}`} style={{ y: yText, opacity: opacityText }}>'

content = content.replace(pattern, replacement)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Updated hero container to glassmorphism.")
