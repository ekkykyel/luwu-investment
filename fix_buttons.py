import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add hover effect for action buttons. 
# Search button "Cari Data"
pattern1 = r"""className=\{\`flex items-center gap-3 px-3 py-1\.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all \$\{"""
replacement1 = r"""className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] ${"""
content = re.sub(pattern1, replacement1, content)

# "Cari Desa" button
pattern2 = r"""className="text-xs w-full pl-10 pr-4 py-2\.5 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"""
replacement2 = r"""className="text-xs w-full pl-10 pr-4 py-2.5 rounded-2xl border transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.4)]"""
content = re.sub(pattern2, replacement2, content)

# Right Sidebar toggle buttons (if any)
with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App buttons")
