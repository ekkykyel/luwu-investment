import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Update Navbar positioning to be z-[100] and add padding to main container if needed
# The navbar is fixed top-0 left-0 right-0 z-[60]
content = content.replace('z-[60]', 'z-[100]')

# Check if main container has enough padding. The section with dashboard elements starts right after the map or in the body.
# Let's just fix the navbar to z-[100] first. Wait, if it's z-[100] it will stay on top, but it shouldn't collide.
# Oh, the user says: "If it is meant to be a top header: Ensure it has fixed top-0 left-0 w-full z-[100]. Ensure the main dashboard container has enough padding (pt-32 or pb-32) so content doesn't get hidden behind it."

# 2. Update AreaChart data
mock_trend_data = """const mockTrendData = [
  { name: 'Aug', value: 1.2 }, { name: 'Sep', value: 1.5 }, { name: 'Oct', value: 1.4 },
  { name: 'Nov', value: 2.1 }, { name: 'Dec', value: 2.8 }, { name: 'Jan', value: 3.2 },
  { name: 'Feb', value: 3.8 }, { name: 'Mar', value: 4.5 }, { name: 'Apr', value: 4.8 },
  { name: 'May', value: 5.2 }, { name: 'Jun', value: 5.5 }, { name: 'Jul', value: 5.8 }
];"""

content = content.replace('<AreaChart\n                      data={areaGrowthData}', f'{mock_trend_data}\n                    <AreaChart\n                      data={{mockTrendData}}')
content = content.replace('<AreaChart data={areaGrowthData}', f'{mock_trend_data}\n                    <AreaChart data={{mockTrendData}}')

# 3. Update PieChart data
mock_sumber_modal = """const mockSumberModal = [
  { name: 'PMDN', value: 85, fill: '#10b981' }, 
  { name: 'PMA', value: 15, fill: '#f59e0b' }
];"""

old_pie = """                        <Pie
                          data={hasPerformanceData ? [
                            { name: t("performance.pmdn", "PMDN (Dalam Negeri)"), value: pmdnPercentage, fill: '#10b981' },
                            { name: t("performance.pma", "PMA (Asing)"), value: pmaPercentage, fill: '#f59e0b' }
                          ] : [
                            { name: 'PMDN (Dalam Negeri)', value: 4.6, fill: '#10b981' },
                            { name: 'PMA (Asing)', value: 1.2, fill: '#f59e0b' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={4}
                          cornerRadius={6}
                          dataKey="value"
                          stroke="none"
                        >"""

new_pie = f"""                        {mock_sumber_modal}
                        <Pie
                          data={{mockSumberModal}}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={{65}}
                          outerRadius={{85}}
                          paddingAngle={{4}}
                          cornerRadius={{6}}
                          stroke="none"
                        >"""
content = content.replace(old_pie, new_pie)

content += '\n// hotfix: force dashboard visuals and z-index\n'

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Updated LandingPage.tsx")
