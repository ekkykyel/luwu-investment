with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('`}                >>', '`}                >')
# also fix gradient for light mode correctly: "bg-gradient-to-t from-white dark:from-slate-950 to-transparent" or since we use isDarkMode:
content = content.replace('from-slate-900 to-transparent', 'from-slate-100 dark:from-slate-950 to-transparent')
# wait, actually we can just use template literal for the gradient inside the JSX!
with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Syntax fixed")
