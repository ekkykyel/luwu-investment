import re

with open('src/components/InvestmentDetailModal.tsx', 'r') as f:
    content = f.read()

# Replace Investment summary cards hover effect
pattern1 = r"""className=\{\`p-0 md:p-3 bg-transparent \$\{isDarkMode \? "md:bg-slate-900/50 md:border md:border-slate-700/50" : "md:bg-slate-100 md:border md:border-slate-200/50"\} rounded-none md:rounded-xl flex flex-col justify-center\`\}"""
replacement1 = r"""className={`p-0 md:p-3 bg-transparent ${isDarkMode ? "md:bg-slate-900/50 md:border md:border-slate-700/50" : "md:bg-slate-100 md:border md:border-slate-200/50"} rounded-none md:rounded-xl flex flex-col justify-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50`}"""
content = re.sub(pattern1, replacement1, content)

# Financial Cards
pattern2 = r"""className=\{\`p-3 md:p-4 bg-transparent \$\{isDarkMode \? "md:bg-slate-900/40 md:border md:border-slate-700/40" : "md:bg-slate-100/50 md:border md:border-slate-200/50"\} rounded-none md:rounded-xl flex flex-col justify-center\`\}"""
replacement2 = r"""className={`p-3 md:p-4 bg-transparent ${isDarkMode ? "md:bg-slate-900/40 md:border md:border-slate-700/40" : "md:bg-slate-100/50 md:border md:border-slate-200/50"} rounded-none md:rounded-xl flex flex-col justify-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50`}"""
content = re.sub(pattern2, replacement2, content)

with open('src/components/InvestmentDetailModal.tsx', 'w') as f:
    f.write(content)
print("Updated Investment summary cards")
