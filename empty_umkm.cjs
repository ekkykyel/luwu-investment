const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Replace umkmData definition
const umkmStart = code.indexOf('const umkmData = [');
if (umkmStart !== -1) {
    const umkmEnd = code.indexOf('];', umkmStart) + 2;
    code = code.substring(0, umkmStart) + 'const umkmData: any[] = [];' + code.substring(umkmEnd);
}

// Modify the rendering logic to show honest fallback if empty
const gridStart = code.indexOf('{/* KATALOG KEMITRAAN UMKM GRID */}');
if (gridStart !== -1) {
    const replacement = `{/* KATALOG KEMITRAAN UMKM GRID */}
            <div className="max-w-6xl mx-auto">
              {umkmData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              ) : (
                <div className={\`w-full max-w-2xl mx-auto p-10 md:p-16 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center \${isDark ? "bg-slate-900/30 border-slate-700/50" : "bg-slate-50/50 border-slate-300"}\`}>
                  <div className={\`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 \${isDark ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-400"}\`}>
                    <Store size={32} />
                  </div>
                  <h4 className={\`text-lg font-bold mb-2 \${isDark ? "text-slate-300" : "text-slate-700"}\`}>
                    Katalog UMKM Belum Tersedia
                  </h4>
                  <p className={\`text-sm \${isDark ? "text-slate-500" : "text-slate-500"}\`}>
                    Saat ini belum ada data mitra UMKM terverifikasi di dalam database kami. Silakan kembali lagi nanti.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>`;

    const nextSectionStart = code.indexOf('{/* Kisah Sukses Investor */}', gridStart);
    if (nextSectionStart !== -1) {
        code = code.substring(0, gridStart) + replacement + '\n\n        ' + code.substring(nextSectionStart);
    }
}

fs.writeFileSync('src/components/LandingPage.tsx', code);
