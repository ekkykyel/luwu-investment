import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

pattern = r"""      \{\/\* Main Basemap Container \(Bottom Sheet on Mobile, Floating on Desktop\) \*\/\}\n      <div \n        className=\{\`fixed inset-x-0 bottom-0 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-\[70\] flex flex-col gap-3 md:gap-1\.5 font-sans select-none items-center pointer-events-auto w-full md:w-auto max-w-full md:max-w-\[96vw\] bg-slate-50/95 dark:bg-slate-900/95 md:bg-transparent md:dark:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-t-3xl md:rounded-none shadow-\[0_-10px_40px_rgba\(0,0,0,0\.5\)\] md:shadow-none border-t border-slate-200 dark:border-slate-800 md:border-none pb-6 md:pb-0 pt-2 md:pt-0 transform transition-transform duration-300 md:translate-y-0 \$\{"""

replacement = r"""      {/* Main Basemap Container (Bottom Sheet on Mobile, Floating on Desktop) */}
      <div 
        className={`fixed inset-x-0 bottom-0 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[70] flex flex-col gap-3 md:gap-1.5 font-sans select-none items-center pointer-events-none w-full md:w-auto max-w-full md:max-w-[96vw] bg-slate-50/95 dark:bg-slate-900/95 md:bg-transparent md:dark:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none border-t border-slate-200 dark:border-slate-800 md:border-none pb-6 md:pb-0 pt-2 md:pt-0 transform transition-transform duration-300 md:translate-y-0 ${"""

content = re.sub(pattern, replacement, content)

# ensure pointer-events-auto on the children
pattern2 = r"""        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-xl rounded-2xl p-1\.5 sm:p-2\.5 flex items-center justify-center gap-1\.5 sm:gap-2 w-max">"""
replacement2 = r"""        <div className="pointer-events-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-xl rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-max">"""
content = re.sub(pattern2, replacement2, content)

pattern3 = r"""        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-xl rounded-2xl w-max ml-auto mr-auto flex divide-x divide-slate-350 dark:divide-slate-705/10 overflow-hidden mb-6 md:mb-0">"""
replacement3 = r"""        <div className="pointer-events-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-xl rounded-2xl w-max ml-auto mr-auto flex divide-x divide-slate-350 dark:divide-slate-705/10 overflow-hidden mb-6 md:mb-0">"""
content = re.sub(pattern3, replacement3, content)

# ensure the swipe handle has pointer-events-auto
pattern4 = r"""        <div \n          className="w-12 h-1\.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 mb-2 md:hidden"\n          onClick=\{\(\) => setShowBasemapSheet\(false\)\}\n        \/>"""
replacement4 = r"""        <div 
          className="pointer-events-auto w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 mb-2 md:hidden"
          onClick={() => setShowBasemapSheet(false)}
        />"""
content = re.sub(pattern4, replacement4, content)


with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)

print("Basemap wrapper updated.")
