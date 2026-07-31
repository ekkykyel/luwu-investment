import re
with open('src/components/InvestmentDetailModal.tsx', 'r') as f:
    content = f.read()

# 1. Action Buttons
pattern1 = r"""className="px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:indigo-500 rounded-xl text-left flex items-start gap-3 shadow-sm hover:shadow-md transition-all group w-full min-h-\[44px\]\""""
replacement1 = r"""className="px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:indigo-500 rounded-xl text-left flex items-start gap-3 shadow-sm transition-all duration-300 ease-in-out active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:border-emerald-500/50 group w-full min-h-[44px]\""""
content = re.sub(pattern1, replacement1, content)

# 2. Simulator Run button
pattern2 = r"""className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/50 transition-all\""""
replacement2 = r"""className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ease-in-out active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]\""""
content = re.sub(pattern2, replacement2, content)

with open('src/components/InvestmentDetailModal.tsx', 'w') as f:
    f.write(content)
print("Updated Modal buttons")
