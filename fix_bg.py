with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 md:from-transparent to-transparent pointer-events-none z-10"',
    'className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${isDarkMode ? "from-slate-950 md:from-transparent" : "from-white md:from-transparent"} to-transparent pointer-events-none z-10`}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("BG fixed")
