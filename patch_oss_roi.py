import re

with open('src/components/OssRoiSimulatorInputs.tsx', 'r') as f:
    content = f.read()

# Fix wrappers
wrapper_old = r'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'
wrapper_new = r'flex justify-between items-center gap-2'
content = content.replace(wrapper_old, wrapper_new)

# Fix numeric values in the summary row
# We will match the specific span classes for CAPEX, TK, OPEX summary row values.
# The common pattern is:
# <span className="text-sm sm:text-base md:text-xl font-black text-... tracking-tight whitespace-nowrap sm:text-right shrink-0 pr-4 sm:pr-6">

pattern = r'<span className="text-sm sm:text-base md:text-xl font-black text-[a-z]+-600 dark:text-[a-z]+-400 tracking-tight whitespace-nowrap sm:text-right shrink-0 pr-4 sm:pr-6">'
replacement = r'<span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate text-right shrink-0">'

content = re.sub(pattern, replacement, content)

# Check labels to ensure they are also small if needed, but they are already text-xs sm:text-sm font-semibold

with open('src/components/OssRoiSimulatorInputs.tsx', 'w') as f:
    f.write(content)

