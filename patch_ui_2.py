import re

with open('src/components/SmartInvestmentFormEngine.tsx', 'r') as f:
    content = f.read()

# Make the remaining labels consistent
content = re.sub(
    r'<label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">',
    r'<label className="text-sm font-medium text-indigo-700 dark:text-indigo-400">',
    content
)
content = re.sub(
    r'<label className="text-xs font-bold text-slate-800 dark:text-slate-200">',
    r'<label className="text-sm font-medium text-slate-800 dark:text-slate-200">',
    content
)

with open('src/components/SmartInvestmentFormEngine.tsx', 'w') as f:
    f.write(content)
