with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

# fix line 2680-2681
lines[2680] = '                </div>\n'

# fix line 5187-5188
lines[5187] = '                </div>\n'

with open('src/components/LandingPage.tsx', 'w') as f:
    f.writelines(lines)
