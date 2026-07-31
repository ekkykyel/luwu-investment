import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Fix mockSumberModal properly
content = re.sub(
    r'<PieChart>\s*{\s*\s*\s*\s*<Pie\s*data={mockSumberModal}',
    r'<PieChart>\n                        <Pie\n                          data={[\n                            { name: \'PMDN\', value: 85, fill: \'#10b981\' },\n                            { name: \'PMA\', value: 15, fill: \'#f59e0b\' }\n                          ]}',
    content,
    flags=re.MULTILINE
)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("PieChart Fixed")
