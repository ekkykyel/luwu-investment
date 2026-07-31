import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r"""            \{\/\* MOBILE BOTTOM ACTION BAR \*\/\}\n            <div className=\{\`md:hidden fixed bottom-0 left-0 right-0 z-\[60\] pb-safe flex justify-around items-center border-t backdrop-blur-xl \$\{"""

replacement = r"""            {/* MOBILE BOTTOM ACTION BAR */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-auto pb-safe flex justify-around items-center border-t backdrop-blur-xl ${"""

content = re.sub(pattern, replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Bottom bar updated.")
