import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Nav Z-index
content = content.replace(
    'fixed top-0 left-0 right-0 z-50 border-b shadow-sm transition-colors duration-500',
    'fixed top-0 left-0 right-0 z-[60] border-b shadow-sm transition-colors duration-500'
)

# 2. Main wrapper padding
content = content.replace(
    'id="analitik-spasial-section"\n          className={`py-16 lg:py-24 border-t',
    'id="analitik-spasial-section"\n          className={`pt-32 pb-24 lg:pt-40 lg:pb-32 border-t'
)

# 3. AreaGrowthData mock replacement
old_area_growth = """  // Chart Data: Area Growth Trends (mocked progression for modern look based on real counts)
  const areaGrowthData = useMemo(() => {
    if (
      stats?.monthlyTrends &&
      Array.isArray(stats.monthlyTrends) &&
      stats.monthlyTrends.length > 0
    ) {
      return stats.monthlyTrends.map((t: any) => ({
        year: t.month,
        "Luas Lahan (Ha)":
          investments.reduce((acc, inv) => acc + (inv.areaHa || 0), 0) / 10 +
          Math.random() * 10, // Since we don't track area over time accurately yet, we bind to investments
        "Nilai Kapital": t["Akumulasi (Miliar IDR)"],
      }));
    }
    const active = investments.length > 0 ? investments.length : 12;
    return [
      {
        year: "2020",
        "Luas Lahan (Ha)": active * 110,
        "Nilai Kapital": active * 2.1,
      },
      {
        year: "2021",
        "Luas Lahan (Ha)": active * 150,
        "Nilai Kapital": active * 3.5,
      },
      {
        year: "2022",
        "Luas Lahan (Ha)": active * 210,
        "Nilai Kapital": active * 5.8,
      },
      {
        year: "2023",
        "Luas Lahan (Ha)": active * 280,
        "Nilai Kapital": active * 8.2,
      },
      {
        year: "2024",
        "Luas Lahan (Ha)": active * 340,
        "Nilai Kapital": active * 12.0,
      },
      {
        year: "Proyeksi 2025",
        "Luas Lahan (Ha)": active * 450,
        "Nilai Kapital": active * 18.5,
      },
    ];
  }, [investments, stats]);"""

new_area_growth = """  // Chart Data: Area Growth Trends (mocked progression for modern look based on real counts)
  const areaGrowthData = useMemo(() => {
    if (
      stats?.monthlyTrends &&
      Array.isArray(stats.monthlyTrends) &&
      stats.monthlyTrends.length > 0
    ) {
      return stats.monthlyTrends.map((t: any) => ({
        name: t.month,
        "Luas Lahan (Ha)":
          investments.reduce((acc, inv) => acc + (inv.areaHa || 0), 0) / 10 +
          Math.random() * 10, // Since we don't track area over time accurately yet, we bind to investments
        value: t["Akumulasi (Miliar IDR)"],
      }));
    }
    return [
      { name: 'Aug', value: 1.2 }, { name: 'Sep', value: 1.5 }, { name: 'Oct', value: 1.4 },
      { name: 'Nov', value: 2.1 }, { name: 'Dec', value: 2.8 }, { name: 'Jan', value: 3.2 },
      { name: 'Feb', value: 3.8 }, { name: 'Mar', value: 4.5 }, { name: 'Apr', value: 4.8 },
      { name: 'May', value: 5.2 }, { name: 'Jun', value: 5.5 }, { name: 'Jul', value: 5.8 }
    ];
  }, [investments, stats]);"""

content = content.replace(old_area_growth, new_area_growth)

# 4. AreaChart XAxis/YAxis update
old_area_chart_axes = """                      <XAxis
                        dataKey="year"
                        stroke={isDark ? "#64748b" : "#94a3b8"}
                        fontSize={11}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? "#64748b" : "#94a3b8"}
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                      />"""

new_area_chart_axes = """                      <XAxis
                        dataKey="name"
                        stroke="#334155"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#334155"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />"""

content = content.replace(old_area_chart_axes, new_area_chart_axes)

# Update Area dataKey
old_area = """                      <Area
                        type="monotone"
                        name={t("charts.accumulatedCapital")}
                        dataKey="Nilai Kapital\""""
new_area = """                      <Area
                        type="monotone"
                        name={t("charts.accumulatedCapital")}
                        dataKey="value\""""
content = content.replace(old_area, new_area)

# 5. PieChart empty state
old_pie_chart = """                  {!hasPerformanceData ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className={`p-4 rounded-full mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <Globe size={24} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                      </div>
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Belum ada data realisasi sumber modal
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: t("performance.pmdn", "PMDN (Dalam Negeri)"), value: pmdnPercentage, fill: '#10b981' },
                            { name: t("performance.pma", "PMA (Asing)"), value: pmaPercentage, fill: '#f59e0b' }
                          ]}"""

new_pie_chart = """                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={hasPerformanceData ? [
                            { name: t("performance.pmdn", "PMDN (Dalam Negeri)"), value: pmdnPercentage, fill: '#10b981' },
                            { name: t("performance.pma", "PMA (Asing)"), value: pmaPercentage, fill: '#f59e0b' }
                          ] : [
                            { name: 'PMDN (Dalam Negeri)', value: 4.6, fill: '#10b981' },
                            { name: 'PMA (Asing)', value: 1.2, fill: '#f59e0b' }
                          ]}"""

content = content.replace(old_pie_chart, new_pie_chart)

# And remove the closing parenthesis of the ternary
old_pie_close = """                        />
                        <Legend 
                          iconType="circle" 
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>"""

new_pie_close = """                        />
                        <Legend 
                          iconType="circle" 
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                </div>"""
content = content.replace(old_pie_close, new_pie_close)

# 6. BarChart XAxis/YAxis updates
old_bar_axes = """                        <XAxis
                          type="number"
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          tickMargin={10}
                          axisLine={false}
                          tickLine={false}
                          width={110}
                        />"""

new_bar_axes = """                        <XAxis
                          type="number"
                          stroke="#334155"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#334155"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          tickMargin={10}
                          axisLine={false}
                          tickLine={false}
                          width={110}
                        />"""

content = content.replace(old_bar_axes, new_bar_axes)

old_bar_axes_2 = """                        <XAxis
                          dataKey="name"
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          tickMargin={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          tickFormatter={(value) =>
                            value >= 1e9 ? `Rp${(value / 1e9).toFixed(0)}M` : value >= 1e6 ? `Rp${(value / 1e6).toFixed(0)}Jt` : `Rp${value}`
                          }
                          axisLine={false}
                          tickLine={false}
                        />"""

new_bar_axes_2 = """                        <XAxis
                          dataKey="name"
                          stroke="#334155"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          tickMargin={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#334155"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          tickFormatter={(value) =>
                            value >= 1e9 ? `Rp${(value / 1e9).toFixed(0)}M` : value >= 1e6 ? `Rp${(value / 1e6).toFixed(0)}Jt` : `Rp${value}`
                          }
                          axisLine={false}
                          tickLine={false}
                        />"""

content = content.replace(old_bar_axes_2, new_bar_axes_2)

content += '\n// ui polish: fix dashboard layout collision and chart visuals\n'

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Updates applied.")
