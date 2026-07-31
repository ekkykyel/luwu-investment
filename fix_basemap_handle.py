import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

pattern = r"""        <div \n          className="pointer-events-auto w-12 h-1\.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 mb-2 md:hidden"\n          onClick=\{\(\) => setShowBasemapSheet\(false\)\}\n        \/>"""
replacement = r"""        <div 
          className="pointer-events-auto w-full h-8 flex items-center justify-center md:hidden cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowBasemapSheet(false);
          }}
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>"""
content = re.sub(pattern, replacement, content)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)
print("Basemap handle updated")
