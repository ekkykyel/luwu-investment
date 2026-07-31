import re
with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d\?auto=format&fit=crop&q=80&w=600"\s*}\s*function getSectorColor', r'image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=600"\n  }];\n\nfunction getSectorColor', content)

content = re.sub(r'const data = \[\s*// Generate data points', r'const data = [];\n    // Generate data points', content)

content = re.sub(r'words\[i\s*setMessages', r'words[i];\n            setMessages', content)

content = re.sub(r'const updated = \[\.\.\.prev\s*if \(updated.length > 0\) {', r'const updated = [...prev];\n              if (updated.length > 0) {', content)

content = re.sub(r'"#8b5cf6",\s*const sectorData = useMemo', r'"#8b5cf6",\n  ];\n    const sectorData = useMemo', content)

content = re.sub(r'"Nilai Kapital": active \* 18\.5,\s*},\s*}, \[investments, stats\]\);', r'"Nilai Kapital": active * 18.5,\n      },\n    ];\n  }, [investments, stats]);', content)

content = re.sub(r'color: "text-indigo-500"\s*}\s*return \(', r'color: "text-indigo-500"\n    }\n  ];\n\n  return (', content)

content = re.sub(r'invCenter = \[center\.geometry\.coordinates\[0\], center\.geometry\.coordinates\[1\]\s*} catch \(e\) {}', r'invCenter = [center.geometry.coordinates[0], center.geometry.coordinates[1]];\n              } catch (e) {}', content)

content = re.sub(r"{ label: `Tanpa inflasi \(0%\)`,            value: noInfl,   color: '#10b981' },\s*return \(", r"{ label: `Tanpa inflasi (0%)`,            value: noInfl,   color: '#10b981' },\n                                  ];\n                                return (", content)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Syntax 7 fixed")
