import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

pattern = r"""className=\{\`fixed inset-x-0 bottom-\[68px\] md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-\[70\]"""
replacement = r"""className={`fixed inset-x-0 bottom-20 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[70]"""
content = re.sub(pattern, replacement, content)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)
print("Basemap position updated in MaplibreComponent.tsx")
