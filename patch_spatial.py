import re

with open('src/components/SpatialEditorStudio.tsx', 'r') as f:
    content = f.read()

# 1. Nuke Display Font
# "KELOLA GIS SPASIAL" title
content = re.sub(
    r'<h2 className="[^"]*">(\s*)KELOLA GIS SPASIAL',
    r'<h2 className="font-sans font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">\1KELOLA GIS SPASIAL',
    content
)

# "PRO VECTOR EDITOR" badge
content = re.sub(
    r'<span className="[^"]*">(\s*)PRO VECTOR EDITOR',
    r'<span className="font-sans font-bold tracking-tight bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded-md text-[10px] uppercase">\1PRO VECTOR EDITOR',
    content
)

# 2. Full-Screen Editor Layout
# `<div className={`w-full h-full flex flex-col overflow-hidden leading-relaxed ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>`
# Replace `h-full` with `h-[calc(100vh-5rem)]`
content = re.sub(
    r'<div className={`w-full h-full flex flex-col overflow-hidden leading-relaxed \$\{isDarkMode \? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`\}>',
    r'<div className={`w-full h-[calc(100vh-5rem)] flex flex-col overflow-hidden leading-relaxed ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>',
    content
)

# 3. Dark Mode Elevation - Left Sidebar (PANEL 1)
# `<aside className={`w-[350px] border-r flex flex-col max-h-full overflow-y-auto shrink-0 custom-scrollbar ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-lg border-slate-200"}`}>`
content = re.sub(
    r'<aside className={`w-\[350px\] border-r flex flex-col max-h-full overflow-y-auto shrink-0 custom-scrollbar \$\{isDarkMode \? "[^"]*" : "bg-white shadow-lg border-slate-200"\}`\}>',
    r'<aside className={`w-[350px] border-r flex flex-col max-h-full overflow-y-auto shrink-0 custom-scrollbar ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-lg border-slate-200"}`}>\n',
    content
)

# Dark Mode Elevation - Right Sidebar (PANEL 3)
content = re.sub(
    r'<aside className={`w-\[340px\] px-4 py-3 border-l flex flex-col gap-4 max-h-full overflow-y-auto shrink-0 custom-scrollbar \$\{isDarkMode \? "[^"]*" : "bg-white shadow-lg border-slate-200"\}`\}>',
    r'<aside className={`w-[340px] px-4 py-3 border-l flex flex-col gap-4 max-h-full overflow-y-auto shrink-0 custom-scrollbar ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-lg border-slate-200"}`}>\n',
    content
)

# 4. 'POLYGON', 'LINE', 'POINT' badges in the bottom left
# `<span className="uppercase font-mono text-[9px]">`
# `{... ? "Polygon" : ... ? "LineString" : "Point"} ({activeEditCoords.length} pts)`
content = re.sub(
    r'<span className="uppercase font-mono text-\[9px\]">(\s*)\{\(editorMode === "DRAW_POLYGON" \|\| editorMode === "EDIT_VERTICES"\) \? "Polygon" : editorMode === "DRAW_LINE" \? "LineString" : "Point"\} \(\{activeEditCoords\.length\} pts\)(\s*)</span>',
    r'<span className="font-medium text-xs rounded-md px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 uppercase">\1{(editorMode === "DRAW_POLYGON" || editorMode === "EDIT_VERTICES") ? "POLYGON" : editorMode === "DRAW_LINE" ? "LINE" : "POINT"} ({activeEditCoords.length} pts)\2</span>',
    content
)

with open('src/components/SpatialEditorStudio.tsx', 'w') as f:
    f.write(content)
