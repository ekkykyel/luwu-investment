import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

pattern = r"""        <div \n          className="pointer-events-auto w-full h-8 flex items-center justify-center md:hidden cursor-pointer"\n          onClick=\{\(e\) => \{\n            e\.stopPropagation\(\);\n            setShowBasemapSheet\(false\);\n          \}\}\n        >"""
replacement = r"""        <div 
          className="pointer-events-auto w-full h-8 flex items-center justify-center md:hidden cursor-pointer bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            setShowBasemapSheet(false);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >"""

content = re.sub(pattern, replacement, content)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)
print("Basemap close button patched")
