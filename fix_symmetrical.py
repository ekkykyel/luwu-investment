import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Left panel (Kontrol Peta)
pattern1 = r"""shrink-0 w-\[85%\] max-w-sm md:w-64 lg:w-80 h-full max-h-full"""
replacement1 = r"""shrink-0 w-[95%] sm:w-[90%] md:max-w-sm md:w-64 lg:w-80 h-full max-h-full"""
content = re.sub(pattern1, replacement1, content)

# Right panel (Analitik)
pattern2 = r"""\? "w-\[85%\] max-w-md md:max-w-none md:w-\[440px\] lg:w-\[490px\] xl:w-\[540px\] h-full max-h-full md:h-auto md:max-h-\[85vh\] overflow-y-auto pb-20 md:pb-0" """
replacement2 = r"""? "w-[95%] sm:w-[90%] md:max-w-none md:w-[440px] lg:w-[490px] xl:w-[540px] h-full max-h-full md:h-auto md:max-h-[85vh] overflow-y-auto pb-20 md:pb-0" """
content = re.sub(pattern2, replacement2, content)

# ensure hotfix text at bottom to trigger sync
if "// hotfix: symmetrical mobile panels and basemap handle" not in content:
    content += "\n// hotfix: symmetrical mobile panels and basemap handle"

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Panels updated")
