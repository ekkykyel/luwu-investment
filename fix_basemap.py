import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

# 1. Always show the Layer toggle button on mobile
content = content.replace("{!showBasemapSheet && (", "")
content = content.replace("onClick={() => setShowBasemapSheet(true)}", "onClick={() => setShowBasemapSheet(!showBasemapSheet)}")
# Remove the closing brace of the condition
# The block ends with:
#         </button>
#       )}
# Let's use regex to replace it
content = re.sub(r"""        </button>\n      \)\}""", """        </button>""", content)

# 2. Make the main basemap container transparent and pointer-events-none
pattern_container = r"""      <div \n        className=\{\`fixed inset-x-0 bottom-20 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-\[70\] flex flex-col gap-3 md:gap-1\.5 font-sans select-none items-center pointer-events-auto md:pointer-events-none w-full md:w-auto max-w-full md:max-w-\[96vw\] bg-slate-50/95 dark:bg-slate-900/95 md:bg-transparent md:dark:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-t-3xl md:rounded-none shadow-\[0_-10px_40px_rgba\(0,0,0,0\.5\)\] md:shadow-none border-t border-slate-200 dark:border-slate-800 md:border-none pb-6 md:pb-0 pt-2 md:pt-0 transform transition-transform duration-300 md:translate-y-0 \$\{"""
replacement_container = r"""      <div 
        className={`fixed inset-x-0 bottom-24 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[70] flex flex-col gap-3 md:gap-1.5 font-sans select-none items-center pointer-events-none w-full md:w-auto max-w-full md:max-w-[96vw] transform transition-transform duration-300 md:translate-y-0 ${"""
content = re.sub(pattern_container, replacement_container, content)

# 3. Remove the drag handle
pattern_handle = r"""        <div \n          className="pointer-events-auto w-full h-8 flex items-center justify-center md:hidden cursor-pointer bg-transparent"\n          onClick=\{\(e\) => \{\n            e\.stopPropagation\(\);\n            setShowBasemapSheet\(false\);\n          \}\}\n          onTouchStart=\{\(e\) => e\.stopPropagation\(\)\}\n          onPointerDown=\{\(e\) => e\.stopPropagation\(\)\}\n          onMouseDown=\{\(e\) => e\.stopPropagation\(\)\}\n        >\n          <div className="w-12 h-1\.5 bg-slate-300 dark:bg-slate-700 rounded-full" />\n        </div>\n"""
content = re.sub(pattern_handle, "", content)

# 4. Improve contrast for the basemap options in dark mode
# and make the word Basemap hidden sm:inline but maybe we should show it if they want.
# User said: "ketika menggunakan mode gelap font tulisan : Basemap. dibuat kontras kawan"
# Actually I'll make the inactive text high contrast.
pattern_inactive = r"""\"text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200\""""
replacement_inactive = r""""text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white\""""
content = re.sub(pattern_inactive, replacement_inactive, content)

# Also let's check the text of "Basemap"
pattern_basemap_text = r"""<span className="text-\[11\.5px\] font-black tracking-wide uppercase text-slate-900 dark:text-white hidden sm:inline">\{t\('mapControls\.baseMap'\)\}</span>"""
replacement_basemap_text = r"""<span className="text-[11.5px] font-black tracking-wide uppercase text-slate-900 dark:text-white">{t('mapControls.baseMap')}</span>"""
content = re.sub(pattern_basemap_text, replacement_basemap_text, content)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)

print("Updated basemap styles")
