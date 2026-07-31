import re
with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

def f(l, a, b):
    idx = l - 1
    lines[idx] = lines[idx].replace(a, b)

f(240, "    }", "    }];")
f(587, "return [", "return [];")
f(588, "const data = [", "const data = [];")
f(899, "words[i", "words[i];")
f(901, "const updated = [...prev", "const updated = [...prev];")
f(1221, '    "#8b5cf6",', '    "#8b5cf6",\n  ];')
f(1281, "      },", "      }\n    ];")
f(1341, '"analytics-section", "ai-assistant"', '"analytics-section", "ai-assistant"];')
f(1430, "    }", "    }];")
f(2386, "center.geometry.coordinates[1]", "center.geometry.coordinates[1]];")
f(3727, " color: '#10b981' },", " color: '#10b981' },\n                                  ];")
f(4244, "COLORS[index % COLORS.length", "COLORS[index % COLORS.length];")
f(4648, "COLORS[index % COLORS.length", "COLORS[index % COLORS.length];")

with open('src/components/LandingPage.tsx', 'w') as fh:
    fh.writelines(lines)
print("Syntax 3 applied")
