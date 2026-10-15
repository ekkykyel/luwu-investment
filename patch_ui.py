import re

with open('src/components/SmartInvestmentFormEngine.tsx', 'r') as f:
    content = f.read()

# 1. Labels
# Standard labels
content = re.sub(
    r'<label className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1"',
    r'<label className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1"',
    content
)
content = re.sub(
    r'<label className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase tracking-wide"',
    r'<label className="text-sm font-medium text-slate-800 dark:text-slate-200"',
    content
)
content = re.sub(
    r'<label className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase"',
    r'<label className="text-sm font-medium text-slate-800 dark:text-slate-200"',
    content
)
content = re.sub(
    r'<label className="text-xs font-normal text-slate-800 dark:text-slate-200"',
    r'<label className="text-sm font-medium text-slate-800 dark:text-slate-200"',
    content
)
content = re.sub(
    r'<label className="text-xs font-normal text-slate-900 dark:text-slate-100 uppercase"',
    r'<label className="text-sm font-medium text-slate-900 dark:text-slate-100"',
    content
)

# Parameter khusus spans
content = re.sub(
    r'<span className="text-\[10px\] text-slate-600 dark:text-slate-400 font-mono">',
    r'<span className="text-sm font-medium text-slate-800 dark:text-slate-200">',
    content
)

# 2. Inputs
input_base_styles = "border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
input_readonly_styles = "border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-base bg-slate-100 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none"

content = re.sub(
    r'className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-normal"',
    f'className="{input_base_styles} font-normal"',
    content
)
content = re.sub(
    r'className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs h-20  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"',
    f'className="{input_base_styles} h-20"',
    content
)
content = re.sub(
    r'className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"',
    f'className="{input_base_styles}"',
    content
)
content = re.sub(
    r'className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"',
    f'className="{input_base_styles}"',
    content
)
content = re.sub(
    r'className="border px-3 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"',
    f'className="{input_readonly_styles}"',
    content
)

# Dark mode bg contrast for 'Parameter Khusus' section (already bg-indigo-50/50).
# Let's check dark mode for bg-indigo-50/50.
content = re.sub(
    r'className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100"',
    r'className="mt-4 p-4 bg-indigo-50 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-slate-700"',
    content
)
content = re.sub(
    r'className="text-xs font-normal text-indigo-800 mb-3 flex items-center gap-2"',
    r'className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2"',
    content
)

# 3. Action Buttons - Batal
content = re.sub(
    r'className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 text-xs font-normal transition-all shadow-sm"',
    r'className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 font-medium text-sm transition-all shadow-sm"',
    content
)
content = re.sub(
    r'className="px-4 py-1.5 rounded-lg border text-xs font-mono tracking-tight hover:bg-slate-500/10 transition"',
    r'className="px-4 py-2 rounded-lg border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 text-sm font-medium transition-all shadow-sm"',
    content
)

# 4. Warnings (Amber text)
content = re.sub(
    r'text-amber-600 font-normal',
    r'text-amber-600 dark:text-amber-400 font-medium',
    content
)
content = re.sub(
    r'bg-amber-100 text-amber-800',
    r'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
    content
)
content = re.sub(
    r'<span className="text-amber-500 italic text-xs">',
    r'<span className="text-amber-600 dark:text-amber-400 italic text-sm">',
    content
)
content = re.sub(
    r'bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs font-normal',
    r'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-sm font-medium',
    content
)

# 5. Some other typography improvements
content = re.sub(
    r'<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">',
    r'<h2 className="text-xl font-bold text-slate-900 dark:text-white">',
    content
)

with open('src/components/SmartInvestmentFormEngine.tsx', 'w') as f:
    f.write(content)

