import re
with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Fix 1: missing ]; for baseFacilities
content = content.replace('              },\n            \n            const invGeom =', '              }\n            ];\n            const invGeom =')

# Fix 2: invalid JSX at mockTrendData
content = re.sub(
    r'const mockTrendData = \[.*?\{ name: \'Jul\', value: 5\.8 \}',
    '',
    content,
    flags=re.DOTALL
)

content = content.replace('<AreaChart\n                      data={mockTrendData}', 
"""<AreaChart
                      data={[
                        { name: "Aug", value: 1.2 }, { name: "Sep", value: 1.5 }, { name: "Oct", value: 1.4 },
                        { name: "Nov", value: 2.1 }, { name: "Dec", value: 2.8 }, { name: "Jan", value: 3.2 },
                        { name: "Feb", value: 3.8 }, { name: "Mar", value: 4.5 }, { name: "Apr", value: 4.8 },
                        { name: "May", value: 5.2 }, { name: "Jun", value: 5.5 }, { name: "Jul", value: 5.8 }
                      ]}""")

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Syntax 8 fixed")
