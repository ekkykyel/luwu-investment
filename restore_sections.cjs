const fs = require('fs');

let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const searchMarker = `              <span>{t("landing.loginInvestor", "Login Investor")}</span>
            </motion.button>
          </div>
        </div>`;

const index = code.indexOf(searchMarker);
if (index === -1) {
    console.error('Could not find CTA login section!');
    process.exit(1);
}

const replacement = searchMarker + `

        {/* KATALOG KEMITRAAN UMKM LUWU */}
        <section id="umkm-section" className={\`relative py-16 sm:py-24 border-t \${isDark ? "bg-[#050A14] border-slate-800" : "bg-slate-50 border-slate-200"} overflow-hidden\`}>
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full bg-emerald-500/5 blur-[80px] mix-blend-screen" />
            <div className="absolute -bottom-[10%] -left-[5%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[100px] mix-blend-screen" />
          </div>
          <div className="container mx-auto px-4 lg:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className={\`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xl border animate-fade-in-up \${isDark ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border-amber-400/30 shadow-sm" : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-300 shadow-sm shadow-amber-500/10"}\`} style={{ animationDelay: '50ms' }}>
                <Store size={14} /> {t("umkm_catalog")}
              </span>
              <h3 className={\`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 animate-fade-in-up \${isDark ? "text-white" : "text-slate-900"}\`} style={{ animationDelay: '150ms' }}>
                {t("umkm_catalog")}
              </h3>
              <p className={\`text-xs sm:text-sm mb-6 animate-fade-in-up \${isDark ? "font-medium text-slate-400" : "font-medium text-slate-600"}\`} style={{ animationDelay: '250ms' }}>
                {t("umkm_catalog_desc")}
              </p>
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {['Semua', 'Kuliner', 'Kriya/Kerajinan'].map(cat => (
                  <motion.button whileTap={{ scale: 0.95 }}
                    key={cat === "Semua" ? (isZh ? "全部" : isEn ? "All" : "Semua") : cat === "Kuliner" ? (isZh ? "烹饪美食" : isEn ? "Culinary" : "Kuliner") : cat === "Kriya/Kerajinan" ? (isZh ? "手工艺品" : isEn ? "Crafts" : "Kriya/Kerajinan") : cat}
                    onClick={() => setActiveFilter(cat)}
                    className={\`px-5 py-2.5 min-h-[44px] rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-xl border \${
                      activeFilter === cat 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-300/40 shadow-lg shadow-emerald-500/30" 
                        : isDark
                          ? "bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 border-slate-700/80 hover:border-emerald-500/40 hover:shadow-md"
                          : "bg-white/80 text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-emerald-300 shadow-sm"
                    }\`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* KATALOG KEMITRAAN UMKM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {umkmData.filter(item => activeFilter === "Semua" || item.kategori === activeFilter).map((product) => (
                <div key={product.id} className={\`flex flex-col group rounded-3xl border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 \${isDark ? "bg-slate-900/40 border-slate-800 hover:border-amber-500/30 hover:shadow-amber-500/10" : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-amber-500/10"}\`}>
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={product.image} 
                      alt={isZh ? (product.nama_produk_zh || product.nama_produk) : isEn ? (product.nama_produk_en || product.nama_produk) : product.nama_produk} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-900 rounded-full shadow-sm backdrop-blur-sm border border-white/20">
                        {product.status_izin}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-3">
                      <h4 className={\`text-lg font-bold font-sans tracking-tight line-clamp-2 leading-snug mb-1 group-hover:text-amber-500 transition-colors \${isDark ? "text-white" : "text-slate-900"}\`}>
                        {isZh ? (product.nama_produk_zh || product.nama_produk) : isEn ? (product.nama_produk_en || product.nama_produk) : product.nama_produk}
                      </h4>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Owner: {product.nama_pemilik}
                      </p>
                    </div>
                    
                    <div className="mt-auto grid grid-cols-1 gap-2 pt-4">
                      <button 
                        onClick={() => setSelectedUMKM(product)}
                        className={\`w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300 \${isDark ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"}\`}
                      >
                        <Search size={14} /> Lihat Detail
                      </button>
                      <a 
                        href={\`https://wa.me/\${product.no_wa}?text=Halo,%20saya%20melihat%20produk%20Anda%20di%20InvestLuwu%20Hub...\`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300"
                      >
                        <MessageCircle size={14} /> Hubungi Pemilik (WA)
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kisah Sukses Investor */}
        <TestimonialSection isDark={isDark} />

        {/* Akuntabilitas Kinerja */}
        <section className={\`relative py-16 sm:py-24 border-t \${isDark ? "bg-[#050A14] border-slate-800" : "bg-slate-50 border-slate-200"}\`}>
          <div className="container mx-auto px-4 lg:px-6 relative z-10 max-w-4xl">
            <div className="text-center mb-10">
              <span className={\`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border \${isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}\`}>
                <Activity size={14} /> {t("performance.tag", "Akuntabilitas Kinerja Pemkab Luwu")}
              </span>
              <h3 className={\`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 \${isDark ? "text-white" : "text-slate-900"}\`}>
                {t("performance.title", "Akuntabilitas Kinerja DPMPTSP Kabupaten Luwu")}
              </h3>
              <p className={\`text-xs sm:text-sm font-medium \${isDark ? "text-slate-400" : "text-slate-600"}\`}>
                {t("performance.subtitle", "Laporan transparan capaian IKM serta standar tingkat layanan (SLA) perizinan terpadu.")}
              </p>
            </div>
            
            <div className={\`rounded-3xl border overflow-hidden \${isDark ? "bg-slate-900/50 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}\`}>
              <div className="p-6 sm:p-8 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700/60">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className={\`text-lg sm:text-xl font-bold \${isDark ? "text-white" : "text-slate-900"}\`}>Indikator Layanan DPMPTSP</h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">SLA & Kepuasan Publik Real-time</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {[
                  { title: "Indeks Kepuasan Masyarakat", desc: "Survei Kepuasan Publik Sesuai Permenpan RB" },
                  { title: "SLA Penerbitan NIB/Izin", desc: "Pemrosesan izin risiko rendah secara instan" },
                  { title: "Akurasi Verifikasi Tata Ruang", desc: "Kesesuaian plotting sistem dengan RT-RW" }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                      <h5 className={\`font-bold text-sm sm:text-base mb-1 \${isDark ? "text-slate-200" : "text-slate-800"}\`}>{item.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Belum ada data tersedia</span>
                      <span className={\`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider \${isDark ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200"}\`}>Belum Ada Data</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ekosistem DPMPTSP */}
        <section className={\`relative py-16 sm:py-24 \${isDark ? "bg-slate-950" : "bg-white"}\`}>
          <div className="container mx-auto px-4 lg:px-6 relative z-10 max-w-6xl">
            <div className="text-center mb-16">
              <h3 className={\`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 \${isDark ? "text-white" : "text-slate-900"}\`}>
                Ekosistem DPMPTSP
              </h3>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Sinergi Layanan Terpadu 4 Bidang Strategis
              </p>
            </div>
            
            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { icon: Megaphone, title: "Bidang Promosi", desc: "Penjaringan & Verifikasi Minat (LoI)", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20" },
                  { icon: ShieldCheck, title: "Bidang Dalak", desc: "Kawal Site Visit & Mediasi Lahan", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" },
                  { icon: Stamp, title: "Bidang Perizinan", desc: "Eksekusi Legalitas & OSS-RBA", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
                  { icon: BarChart3, title: "Bidang Data", desc: "Pusat Komando & Dashboard Eksekutif", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className={\`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-lg \${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} relative z-10\`}>
                      <div className={\`w-14 h-14 rounded-xl flex items-center justify-center \${item.bg} \${item.color}\`}>
                        <item.icon size={24} />
                      </div>
                    </div>
                    <h5 className={\`font-bold text-sm sm:text-base mb-1.5 \${isDark ? "text-slate-200" : "text-slate-800"}\`}>{item.title}</h5>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modal Detail UMKM */}
        <AnimatePresence>
          {selectedUMKM && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setSelectedUMKM(null)}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={\`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border \${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}\`}
              >
                <button 
                  onClick={() => setSelectedUMKM(null)}
                  className={\`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md border transition-colors \${isDark ? "bg-black/50 border-white/10 text-white hover:bg-black/80" : "bg-white/80 border-slate-200 text-slate-800 hover:bg-white"}\`}
                >
                  <X size={20} />
                </button>

                <div className="w-full h-64 sm:h-80 relative bg-slate-100 dark:bg-slate-800">
                  <img src={selectedUMKM.image} alt={isZh ? (selectedUMKM.nama_produk_zh || selectedUMKM.nama_produk) : isEn ? (selectedUMKM.nama_produk_en || selectedUMKM.nama_produk) : selectedUMKM.nama_produk} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white rounded-full shadow-sm">
                      {isZh ? selectedUMKM.kategori_zh : isEn ? selectedUMKM.kategori_en : selectedUMKM.kategori}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BadgeCheck size={16} className="text-blue-400" />
                          <span className="text-[10px] font-medium uppercase tracking-wider text-white/90">Izin/Legalitas Terverifikasi</span>
                        </div>
                        <h3 className={\`text-lg sm:text-xl font-bold font-sans tracking-tight leading-snug mb-1.5 \${isDark ? "text-white" : "text-slate-900"}\`}>{isZh ? (selectedUMKM.nama_produk_zh || selectedUMKM.nama_produk) : isEn ? (selectedUMKM.nama_produk_en || selectedUMKM.nama_produk) : selectedUMKM.nama_produk}</h3>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs font-medium text-white/80 mb-1 uppercase tracking-wider">Status Legalitas</p>
                        <p className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-lg border border-white/20 inline-block backdrop-blur-md">
                          {selectedUMKM.status_izin}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Harga Indikatif</p>
                        <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedUMKM.harga}
                        </p>
                      </div>

                      {selectedUMKM.kategori === 'Kuliner' && selectedUMKM.bahan && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package size={16} className="text-amber-500" />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Komposisi / Bahan Utama</p>
                          </div>
                          <p className={\`text-sm sm:text-base \${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}\`}>{isZh ? selectedUMKM.bahan_zh : isEn ? selectedUMKM.bahan_en : selectedUMKM.bahan}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className={\`p-4 rounded-2xl border \${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}\`}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Owner / Penanggung Jawab</p>
                        <p className={\`text-sm sm:text-base \${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}\`}>{selectedUMKM.nama_pemilik}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={16} className="text-blue-500" />
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lokasi Produksi</p>
                        </div>
                        <p className={\`text-sm sm:text-base \${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}\`}>{isZh ? selectedUMKM.alamat_zh : isEn ? selectedUMKM.alamat_en : selectedUMKM.alamat}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <button 
                      onClick={() => handleShareUMKM(selectedUMKM)}
                      className={\`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 min-h-[44px] rounded-xl font-bold text-sm transition-colors border \${isDark ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}\`}
                    >
                      <Share2 size={16} /> Bagikan
                    </button>
                    <a 
                      href={\`https://wa.me/\${selectedUMKM.no_wa}?text=Halo,%20saya%20melihat%20produk%20Anda%20di%20InvestLuwu%20Hub...\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 min-h-[44px] rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-600/20"
                    >
                      <MessageCircle size={16} /> Hubungi via WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Minimalis */}
        <footer className={\`relative border-t py-8 sm:py-12 \${isDark ? "bg-[#050A14] border-slate-800" : "bg-white border-slate-200"}\`}>
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <img src="/logo-luwu.png" alt="Logo Luwu" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Lambang_Kabupaten_Luwu.png/180px-Lambang_Kabupaten_Luwu.png"; }} />
                </div>
                <div>
                  <h3 className={\`font-bold text-lg leading-tight tracking-tight \${isDark ? "text-white" : "text-slate-900"}\`}>InvestLuwu Hub</h3>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Pemerintah Kabupaten Luwu</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {['Beranda', 'Potensi Regional', 'Infrastruktur', 'Dashboard Interaktif'].map((link) => (
                  <button key={link} className={\`text-[11px] font-semibold hover:text-emerald-500 transition-colors \${isDark ? "text-slate-400" : "text-slate-600"}\`}>
                    {link}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-medium text-slate-500">
              <p>© 2026 Pemerintah Kabupaten Luwu. Hak Cipta Dilindungi Undang-Undang.</p>
              <p className="font-mono">Versi 2.0.1 (Precision Engine)</p>
            </div>
          </div>
        </footer>`;

code = code.substring(0, index) + replacement + `\n      </div>\n    </div>\n  );\n}\n`;

fs.writeFileSync('src/components/LandingPage.tsx', code);
