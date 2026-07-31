import re
with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Update grid-cols for better mobile
# Replace grid-cols-2 md:grid-cols-4 with grid-cols-1 sm:grid-cols-2 md:grid-cols-4
content = content.replace("grid grid-cols-2 md:grid-cols-4", "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4")

# Update H2 text sizes: text-4xl lg:text-5xl -> text-3xl sm:text-4xl lg:text-5xl
content = content.replace("text-4xl lg:text-5xl", "text-3xl sm:text-4xl lg:text-5xl")

# Ensure buttons have min-h-[44px]
# Search for px-6 py-3 or px-8 py-4 and add min-h-[44px]
content = re.sub(r'(px-\d+ py-\d+(?:\.\d+)?(?!\s*min-h-\[44px\]))', r'\1 min-h-[44px]', content)

# Check for grid-cols-1 md:grid-cols-3 -> this is fine because grid-cols-1 is mobile-first.

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
