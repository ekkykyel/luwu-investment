import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Fix panels to be w-full on mobile
pattern_panel1 = r"""shrink-0 w-\[95%\] sm:w-\[90%\] md:max-w-sm md:w-64 lg:w-80 h-full max-h-full"""
replace_panel1 = r"""shrink-0 w-full md:max-w-sm md:w-64 lg:w-80 h-full max-h-full"""
content = re.sub(pattern_panel1, replace_panel1, content)

pattern_panel2 = r"""\? "w-\[95%\] sm:w-\[90%\] md:max-w-none md:w-\[440px\] lg:w-\[490px\] xl:w-\[540px\] h-full max-h-full md:h-auto md:max-h-\[85vh\] overflow-y-auto pb-20 md:pb-0" """
replace_panel2 = r"""? "w-full md:max-w-none md:w-[440px] lg:w-[490px] xl:w-[540px] h-full max-h-full md:h-auto md:max-h-[85vh] overflow-y-auto pb-20 md:pb-0" """
content = re.sub(pattern_panel2, replace_panel2, content)


# 2. Make Brand Title wrap on mobile so "Hub Analitik" is not cut off
pattern_brand = r"""        \{\/\* Brand Title \*\/\}\n        <div className=\{\`flex items-center gap-2 md:gap-3 pointer-events-auto"""
replace_brand = r"""        {/* Brand Title */}
        <div className={`flex flex-wrap items-center gap-2 md:gap-3 pointer-events-auto"""
content = re.sub(pattern_brand, replace_brand, content)


# 3. Un-hide Search elements on mobile
pattern_search1 = r"""            className=\{\`hidden sm:flex items-center gap-3 px-3 py-1\.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all \$\{"""
replace_search1 = r"""            className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all ${"""
content = re.sub(pattern_search1, replace_search1, content)

pattern_search2 = r"""            <div className="relative w-80 max-w-sm hidden md:block pointer-events-auto">"""
replace_search2 = r"""            <div className="relative w-full sm:w-80 max-w-sm pointer-events-auto">"""
content = re.sub(pattern_search2, replace_search2, content)

content += "\n// hotfix: unhide search and center panels on portrait"

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Portrait issues patched")
