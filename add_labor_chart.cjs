const fs = require('fs');

let code = fs.readFileSync('src/components/AnalitikSpasialSection.tsx', 'utf8');

const insertionPoint = '          </div>\n        </div>\n      </div>\n    </>\n  );\n};';

if (code.includes(insertionPoint)) {
    const replacement = `
            {/* CHART 5: SERAPAN TENAGA KERJA */}
            <div
              className={\`col-span-1 md:col-span-full p-6 rounded-3xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group \${computedCardBg}\`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-3">
                  <div
                    className={\`p-3 rounded-2xl \${isDark ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}\`}
                  >
                    <Users size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Serapan Tenaga Kerja
                    </h3>
                    <p
                      className={\`text-[10px] font-bold uppercase tracking-widest \${textMuted}\`}
                    >
                      Dampak Sosial Investasi
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metrics */}
                <div className="col-span-1 flex flex-col justify-center gap-6">
                  <div className={\`p-5 rounded-2xl border \${isDark ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"}\`}>
                    <p className={\`text-[10px] font-bold uppercase tracking-wider mb-2 \${textMuted}\`}>Target Serapan 2026</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">12.500</span>
                      <span className={\`text-xs font-medium pb-1 \${textMuted}\`}>Orang</span>
                    </div>
                  </div>
                  
                  <div className={\`p-5 rounded-2xl border \${isDark ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"}\`}>
                    <p className={\`text-[10px] font-bold uppercase tracking-wider mb-2 \${textMuted}\`}>Realisasi Serapan</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">8.420</span>
                      <span className={\`text-xs font-medium pb-1 \${textMuted}\`}>Orang</span>
                    </div>
                    <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="col-span-1 lg:col-span-2 h-[260px] min-h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Triwulan I", "Tenaga Kerja Lokal (TKL)": 2100, "Tenaga Kerja Asing (TKA)": 45 },
                        { name: "Triwulan II", "Tenaga Kerja Lokal (TKL)": 3400, "Tenaga Kerja Asing (TKA)": 52 },
                        { name: "Triwulan III", "Tenaga Kerja Lokal (TKL)": 2920, "Tenaga Kerja Asing (TKA)": 48 },
                        { name: "Triwulan IV (Est)", "Tenaga Kerja Lokal (TKL)": 0, "Tenaga Kerja Asing (TKA)": 0 }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke={isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.12)"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
                        contentStyle={{
                          background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(12px)",
                          border: \`1px solid \${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}\`,
                          borderRadius: "16px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                        itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                        labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "15px", fontSize: "11px" }}
                      />
                      <Bar dataKey="Tenaga Kerja Lokal (TKL)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                      <Bar dataKey="Tenaga Kerja Asing (TKA)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
`;
    
    code = code.replace(insertionPoint, replacement);
    fs.writeFileSync('src/components/AnalitikSpasialSection.tsx', code);
    console.log('Successfully inserted Labor Absorption chart');
} else {
    console.error('Insertion point not found');
}
