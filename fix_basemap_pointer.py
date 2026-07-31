import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

pattern = r"""className=\{\`fixed inset-x-0 bottom-20 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-\[70\] flex flex-col gap-3 md:gap-1\.5 font-sans select-none items-center pointer-events-none w-full md:w-auto"""
replacement = r"""className={`fixed inset-x-0 bottom-20 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[70] flex flex-col gap-3 md:gap-1.5 font-sans select-none items-center pointer-events-auto md:pointer-events-none w-full md:w-auto"""

content = re.sub(pattern, replacement, content)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)
print("Basemap pointer events patched")
