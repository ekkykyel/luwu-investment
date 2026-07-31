import re
with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# 228
content = content.replace('    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=600"\n  }\nfunction getSectorColor(sector: string) {', '    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=600"\n  }];\nfunction getSectorColor(sector: string) {')

# 588
content = content.replace('    const data = [\n    // Generate data points', '    const data = [];\n    // Generate data points')

# 901
content = content.replace('words[i\n            setMessages', 'words[i];\n            setMessages')

# 903
content = content.replace('const updated = [...prev\n              if (updated.length > 0) {', 'const updated = [...prev];\n              if (updated.length > 0) {')

# 1221
content = content.replace('    "#8b5cf6",\n    const sectorData = useMemo(() => {', '    "#8b5cf6",\n  ];\n    const sectorData = useMemo(() => {')

# 1281
content = content.replace('        "Nilai Kapital": active * 18.5,\n      },\n      }, [investments, stats]);', '        "Nilai Kapital": active * 18.5,\n      },\n    ];\n  }, [investments, stats]);')

# 1430
content = content.replace('      color: "text-indigo-500"\n    }\n    return (\n    <div', '      color: "text-indigo-500"\n    }\n  ];\n\n  return (\n    <div')

# 2386
content = content.replace('invCenter = [center.geometry.coordinates[0], center.geometry.coordinates[1]\n              } catch (e) {}', 'invCenter = [center.geometry.coordinates[0], center.geometry.coordinates[1]];\n              } catch (e) {}')

# 3727
content = content.replace("{ label: `Tanpa inflasi (0%)`,            value: noInfl,   color: '#10b981' },\n                                \n                                return (", "{ label: `Tanpa inflasi (0%)`,            value: noInfl,   color: '#10b981' },\n                                ];\n                                return (")

# 4648
content = content.replace('let fillVal = COLORS[index % COLORS.length\n                            if (sector === "Pariwisata")', 'let fillVal = COLORS[index % COLORS.length];\n                            if (sector === "Pariwisata")')

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Syntax 6 fixed via regex string match")
