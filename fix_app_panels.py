import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Left Panel Width and Padding
pattern1 = r"""                  className=\{\`fixed inset-y-0 left-0 md:relative md:bottom-auto md:left-auto md:right-auto shrink-0 w-full sm:w-\[90%\] md:w-64 lg:w-80 h-full max-h-full relative overflow-hidden pointer-events-auto flex flex-col gap-3 z-\[50\] md:rounded-none shadow-\[12px_0_50px_rgba\(0,0,0,0\.5\)\] md:shadow-none \$\{isDarkMode \? "bg-slate-950 md:bg-transparent text-white" : "bg-white md:bg-transparent text-slate-900"\} border-r border-white/10 md:border-transparent\`\}"""
replacement1 = r"""                  className={`fixed inset-y-0 left-0 md:relative md:bottom-auto md:left-auto md:right-auto shrink-0 w-[85%] max-w-sm md:w-64 lg:w-80 h-full max-h-full relative overflow-hidden pointer-events-auto flex flex-col gap-3 z-[70] md:z-[50] md:rounded-none shadow-[12px_0_50px_rgba(0,0,0,0.5)] md:shadow-none ${isDarkMode ? "bg-slate-950 md:bg-transparent text-white" : "bg-white md:bg-transparent text-slate-900"} border-r border-white/10 md:border-transparent`}"""
content = re.sub(pattern1, replacement1, content)

pattern2 = r"""                  <div className="flex-1 w-full h-full overflow-y-auto pb-24 md:pb-12 px-4 md:px-0 pt-24 md:pt-4 flex flex-col gap-3"""
replacement2 = r"""                  <div className="flex-1 w-full h-full overflow-y-auto pb-24 md:pb-12 px-4 md:px-0 pt-6 md:pt-4 flex flex-col gap-3"""
content = re.sub(pattern2, replacement2, content)

# 2. Right Panel Width and Padding
pattern3 = r"""                      \? "w-full sm:w-\[90%\] md:max-w-none md:w-\[440px\] lg:w-\[490px\] xl:w-\[540px\] h-full max-h-full md:h-auto md:max-h-\[85vh\] overflow-y-auto pt-24 md:pt-0 pb-24 md:pb-0" """
replacement3 = r"""                      ? "w-[85%] max-w-md md:max-w-none md:w-[440px] lg:w-[490px] xl:w-[540px] h-full max-h-full md:h-auto md:max-h-[85vh] overflow-y-auto pb-20 md:pb-0" """
content = re.sub(pattern3, replacement3, content)

# 3. Update the Right Panel Wrapper Z-index
pattern4 = r"""                  className=\{\`fixed inset-y-0 right-0 md:absolute md:inset-auto md:right-4 md:top-4 z-\[50\] pointer-events-auto origin-top-right md:origin-right transition-all duration-300 \$\{"""
replacement4 = r"""                  className={`fixed inset-y-0 right-0 md:absolute md:inset-auto md:right-4 md:top-4 z-[70] md:z-[50] pointer-events-auto origin-top-right md:origin-right transition-all duration-300 ${"""
content = re.sub(pattern4, replacement4, content)

# Update overlays z-index to 65 so they sit under 70 but above map
pattern_overlay1 = r"""                  className="md:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-md z-\[50\] pointer-events-auto\""""
replacement_overlay1 = r"""                  className="md:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-md z-[65] pointer-events-auto\""""
content = re.sub(pattern_overlay1, replacement_overlay1, content)

pattern_overlay2 = r"""                  className="lg:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-md z-\[50\] pointer-events-auto\""""
replacement_overlay2 = r"""                  className="lg:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-md z-[65] pointer-events-auto\""""
content = re.sub(pattern_overlay2, replacement_overlay2, content)

content += "\n// hotfix: restore proportional mobile panels and z-indexes"

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("App.tsx panels restored")
