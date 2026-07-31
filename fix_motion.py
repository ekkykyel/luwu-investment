import re
with open('src/components/InvestmentDetailModal.tsx', 'r') as f:
    content = f.read()

# Replace <motion.div with <div
content = content.replace("<motion.div", "<div")
# Also might need to remove layout prop
content = content.replace(" layout", "")
# Also remove any initial, animate, exit, transition props that might be broken
# but actually <div> ignores them or React warns about them. Better to just leave them or strip them.
# Let's see what happens if I leave them, React will probably give warnings in console. 
# Let's remove them to be clean.
content = re.sub(r"""initial=\{\{.*?\}\}""", "", content)
content = re.sub(r"""animate=\{\{.*?\}\}""", "", content)
content = re.sub(r"""exit=\{\{.*?\}\}""", "", content)
content = re.sub(r"""transition=\{\{.*?\}\}""", "", content)


with open('src/components/InvestmentDetailModal.tsx', 'w') as f:
    f.write(content)
