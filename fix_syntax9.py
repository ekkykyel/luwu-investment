import re
with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'              \},\n\s+const invGeom', r'              }\n            ];\n            const invGeom', content)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Syntax 9 fixed")
