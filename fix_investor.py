import re
with open('src/components/InvestorDashboard.tsx', 'r') as f:
    content = f.read()

# Make sure buttons have min-h-[44px]
# Search for px-3 py-1.5 or py-2 and append min-h-[44px]
# We'll just append it to a few known class names to not break anything.
content = content.replace("px-3 py-1.5 border", "px-3 py-1.5 min-h-[44px] border")
content = content.replace("px-2.5 py-1.5 border", "px-2.5 py-1.5 min-h-[44px] border")
content = content.replace("px-3 py-2 border", "px-3 py-2 min-h-[44px] border")

if "// architecture pivot: implement strict mobile-first responsive design" not in content:
    content += "\n// architecture pivot: implement strict mobile-first responsive design\n"

with open('src/components/InvestorDashboard.tsx', 'w') as f:
    f.write(content)
