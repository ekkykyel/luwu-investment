import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Pattern for the motion.aside opening tag and className
pattern = r'(<motion\.aside\s+key="left-sidebar"[\s\S]*?className={`fixed inset-y-0 left-0 md:relative md:bottom-auto md:left-auto md:right-auto shrink-0 w-\[85%\] max-w-sm md:w-64 lg:w-80 h-full max-h-full) overflow-y-auto custom-scrollbar (pointer-events-auto flex flex-col gap-3 z-\[50\]) pb-24 md:pb-12 px-4 md:px-0 pt-6 md:pt-4 (md:rounded-none shadow-\[12px_0_50px_rgba\(0,0,0,0\.5\)\] md:shadow-none \$\{isDarkMode \? "bg-slate-950 md:bg-transparent text-white" : "bg-white md:bg-transparent text-slate-900"\} border-r border-white/10 md:border-transparent`}\s*>)'

def replacement(match):
    prefix = match.group(1)
    middle = match.group(2)
    suffix = match.group(3)
    
    new_aside = f'{prefix} relative overflow-hidden {middle} {suffix}>'
    inner_div = f'\n                  <div className="flex-1 w-full h-full overflow-y-auto pb-24 md:pb-12 px-4 md:px-0 pt-6 md:pt-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">'
    
    return new_aside + inner_div

content = re.sub(pattern, replacement, content)

# Now we need to add the closing div and the gradient mask before </motion.aside>
# We specifically want to match the first </motion.aside> after the left-sidebar
# Find the end of the motion.aside
end_pattern = r'(</motion\.aside>)'

# We only want to replace the first occurrence (which is left-sidebar)
first_end_idx = content.find('</motion.aside>')
if first_end_idx != -1:
    before = content[:first_end_idx]
    after = content[first_end_idx:]
    
    gradient_html = f'''                  </div>
                  {{/* Bottom fade out gradient */}}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10"></div>
                '''
    content = before + gradient_html + after

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Sidebar fix applied")
