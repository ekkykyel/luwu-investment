import re
with open('src/components/InvestorDashboard.tsx', 'r') as f:
    content = f.read()

pattern1 = r"""className=\{\`shrink-0 flex flex-col gap-3 p-3\.5 sm:p-4 mb-3\.5 rounded-2xl border transition-all duration-300 \$\{"""
replacement1 = r"""className={`shrink-0 flex flex-col gap-3 p-3.5 sm:p-4 mb-3.5 rounded-2xl border transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50 ${"""
content = re.sub(pattern1, replacement1, content)

with open('src/components/InvestorDashboard.tsx', 'w') as f:
    f.write(content)
print("Updated InvestorDashboard cards")
