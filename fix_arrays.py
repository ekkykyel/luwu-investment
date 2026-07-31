import re
with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'Investment\[(\r?\n)', r'Investment[];\1', content)
content = re.sub(r'District\[(\r?\n)', r'District[];\1', content)
content = re.sub(r'any\[(\r?\n)', r'any[];\1', content)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
