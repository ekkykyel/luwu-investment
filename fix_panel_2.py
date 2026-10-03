import re
with open('src/App.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    'p-5 rounded-3xl border backdrop-blur-md transition-all duration-300 ${isDarkMode ? "bg-white dark:bg-slate-900/40 border-slate-700/50" : "bg-white/60 border-white/40 shadow-sm"}',
    'p-5 rounded-xl border transition-all duration-300 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-md border-slate-100"}'
)
content = content.replace(
    'p-5 rounded-3xl border flex flex-col gap-5 backdrop-blur-md transition-all duration-300 ${isDarkMode ? "bg-white dark:bg-slate-900/40 border-slate-700/50" : "bg-white/60 border-white/40 shadow-sm"}',
    'p-5 rounded-xl border flex flex-col gap-5 transition-all duration-300 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-md border-slate-100"}'
)
with open('src/App.tsx', 'w') as f:
    f.write(content)
