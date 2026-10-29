import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  FileText,
  ChevronDown,
  X,
  Clock,
  MapPin,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

/**
 * Isolated Theme Comparison Component for E1 Phase Approval
 * Demonstrates: Hero Banner + Main Card (L1) + Nested Sub-Card (L2) + CTA + Input + Secondary Text + L3 Modal/Dropdown
 * Covers BOTH Route "/" (Invest Luwu) and Route "/mpp" (Portal MPP Simpurusiang)
 * Does NOT alter global app styles until approved.
 */
export function ThemeComparisonPreview() {
  const [selectedRoute, setSelectedRoute] = useState<'mpp' | 'invest'>('mpp');
  const [showDropdown, setShowDropdown] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Theme tokens
  const theme = {
    bgBase: '#0A2238',      // L0 Viewport Base
    bgSurface: '#0F2D4A',   // L1 Main Card / Container
    bgElevated: '#143755',  // L2 Nested Card / Input / Sub-panel
    bgOverlay: '#1A4366',   // L3 Modal / Popover / Dropdown
    border: 'rgba(255, 255, 255, 0.09)',
    textPrimary: '#E2E8F0',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    accentEmerald: '#34D399',
    btnCtaBg: '#047857',    // Emerald-700 for high-contrast white text
  };

  return (
    <div className="w-full p-4 sm:p-8 rounded-3xl space-y-6 font-sans border shadow-2xl transition-colors duration-300" style={{ backgroundColor: theme.bgBase, borderColor: theme.border, color: theme.textPrimary }}>
      {/* 1. Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: theme.border }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              PRATINJAU TEMA DARK MODE (#0A2238 — RONA NAVY ~210°)
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight mt-1">
            Validasi Komponen L0 / L1 / L2 / L3 & Kepatuhan Kontras WCAG
          </h3>
          <p className="text-xs mt-0.5" style={{ color: theme.textTertiary }}>
            Perbedaan kedalaman berbasis kecerahan bertahap (bukan colored glow) • Radius L1: <code className="text-emerald-400">rounded-2xl</code>, L2: <code className="text-emerald-400">rounded-xl</code>
          </p>
        </div>

        {/* Route Selector Tab */}
        <div className="inline-flex rounded-xl p-1 gap-1" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
          <button
            onClick={() => setSelectedRoute('mpp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedRoute === 'mpp' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'hover:text-white'
            }`}
            style={{ color: selectedRoute === 'mpp' ? '#ffffff' : theme.textSecondary }}
          >
            Route /mpp (Portal Simpurusiang)
          </button>
          <button
            onClick={() => setSelectedRoute('invest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedRoute === 'invest' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'hover:text-white'
            }`}
            style={{ color: selectedRoute === 'invest' ? '#ffffff' : theme.textSecondary }}
          >
            Route / (Invest Luwu)
          </button>
        </div>
      </div>

      {/* 2. Hero Preview Section (L0 Base with L1 Content) */}
      <div className="p-6 sm:p-8 rounded-2xl relative overflow-hidden" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
        <div className="max-w-2xl space-y-3">
          {/* Badge Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase" style={{ backgroundColor: theme.bgElevated, color: theme.accentEmerald, border: `1px solid ${theme.border}` }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{selectedRoute === 'mpp' ? 'MAL PELAYANAN PUBLIK KABUPATEN LUWU' : 'PLATFORM INVESTASI SPASIAL DAERAH'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
            {selectedRoute === 'mpp' 
              ? 'Pusat Pelayanan Terpadu Satu Pintu Simpurusiang' 
              : 'Peluang Investasi Unggulan & Analisis Kelayakan Presisi'}
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
            {selectedRoute === 'mpp'
              ? 'Integrasi 19 instansi resmi pemerintah dan BUMN dengan transparansi persyaratan berkas, antrean digital langsung, dan estimasi waktu terukur.'
              : 'Akses data spasial IPRO resmi, simulasi kelayakan finansial (NPV/IRR), dan perizinan terpadu Kabupaten Luwu secara transparan.'}
          </p>

          {/* Search Input Preview (L2 Elevated Background inside L1) */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textTertiary }} />
              <input
                type="text"
                defaultValue={selectedRoute === 'mpp' ? 'Perpanjangan SIM & KTP-el' : 'Kawasan Industri Bua & Smelter'}
                placeholder="Ketik kata kunci pencarian..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                style={{ backgroundColor: theme.bgElevated, color: theme.textPrimary, border: `1px solid ${theme.border}` }}
              />
            </div>

            {/* CTA Button (Emerald-700 with high-contrast white text, neutral shadow) */}
            <button 
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
              style={{ backgroundColor: theme.btnCtaBg }}
            >
              <span>{selectedRoute === 'mpp' ? 'Ambil Antrean' : 'Eksplorasi Peta'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grid Cards Preview (L1 Outer Card with rounded-2xl + L2 Inner Sub-Card with rounded-xl) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Primary Showcase */}
        <div className="p-6 rounded-2xl space-y-4 relative" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400" style={{ backgroundColor: theme.bgElevated }}>
                {selectedRoute === 'mpp' ? <Building2 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
                  {selectedRoute === 'mpp' ? 'DPMPTSP Kab. Luwu (Loket 01-04)' : 'Proyek IPRO: Pengolahan Kopi Latimojong'}
                </h4>
                <span className="text-[11px] font-mono" style={{ color: theme.textTertiary }}>
                  {selectedRoute === 'mpp' ? 'Lantai 1 • Sayap Barat' : 'Sektor Agribisnis • Nilai Rp 45 Miliar'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              {selectedRoute === 'mpp' ? 'PELAYANAN AKTIF' : 'SIAP TAWAR (READY)'}
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            {selectedRoute === 'mpp'
              ? 'Penyelenggaraan izin berusaha berbasis risiko OSS RBA dan perizinan non-usaha daerah tanpa pungutan retribusi liar.'
              : 'Pengembangan sentra hilirisasi komoditas kopi arabika organik dengan ketersediaan lahan HPL dan akses logistik terjamin.'}
          </p>

          {/* Nested Card (L2 Elevated Background with rounded-xl) */}
          <div className="p-4 rounded-xl space-y-2.5" style={{ backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between text-xs font-bold" style={{ color: theme.textPrimary }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{selectedRoute === 'mpp' ? 'Standar Waktu Layanan (SLA)' : 'Simulasi Kelayakan Finansial'}</span>
              </span>
              <span className="font-mono text-emerald-400">{selectedRoute === 'mpp' ? '8.5 Menit' : 'IRR: 24.8%'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.bgBase }}>
              <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
            </div>
            <div className="flex items-center justify-between text-[11px] pt-0.5" style={{ color: theme.textSecondary }}>
              <span>{selectedRoute === 'mpp' ? 'Tingkat Kepuasan (SKM):' : 'Net Present Value (NPV):'}</span>
              <span className="font-mono font-bold" style={{ color: theme.textPrimary }}>
                {selectedRoute === 'mpp' ? '88.54 / 100.00' : '+Rp 6,50 Miliar'}
              </span>
            </div>
            <span className="text-[10px] block" style={{ color: theme.textTertiary }}>
              {selectedRoute === 'mpp'
                ? 'Sumber: Hasil survei berkala 1.250 responden terverifikasi.'
                : 'Asumsi diskonto 8.0%, tenor analisis 10 tahun.'}
            </span>
          </div>
        </div>

        {/* Card B: Interactive L3 Dropdown / Popover Elevation Showcase */}
        <div className="p-6 rounded-2xl space-y-4 relative" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-400" style={{ backgroundColor: theme.bgElevated }}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
                  Elevasi L3: Dropdown & Modal Panel
                </h4>
                <span className="text-[11px] font-mono" style={{ color: theme.textTertiary }}>
                  Layer #1A4366 • Bayangan Netral rgba(0,0,0,0.25)
                </span>
              </div>
            </div>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-xs font-semibold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary }}
            >
              <span>{showDropdown ? 'Tutup Panel L3' : 'Buka Panel L3'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            Elemen yang melayang (overlay, modal, popover, filter menu) menggunakan token L3 <code className="text-emerald-400">--bg-overlay (#1A4366)</code> untuk hierarki visual yang jelas tanpa efek pendar neon.
          </p>

          {/* L3 Overlay Menu Component */}
          {showDropdown && (
            <div className="p-4 rounded-xl space-y-3 shadow-xl border animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: theme.bgOverlay, borderColor: theme.border, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)' }}>
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.border }}>
                <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>
                  {selectedRoute === 'mpp' ? 'Daftar Loket Tersedia (L3 Menu)' : 'Filter Sektor Investasi (L3 Menu)'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10">
                  Layer 3 (#1A4366)
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg flex items-center justify-between transition-colors hover:bg-white/5 cursor-pointer">
                  <span style={{ color: theme.textPrimary }}>
                    {selectedRoute === 'mpp' ? '1. Loket Dukcapil (KTP, KK, Akta)' : '1. Sektor Hilirisasi Kelapa Sawit & CPO'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Tersedia</span>
                </div>
                <div className="p-2 rounded-lg flex items-center justify-between transition-colors hover:bg-white/5 cursor-pointer">
                  <span style={{ color: theme.textPrimary }}>
                    {selectedRoute === 'mpp' ? '2. Loket Bapenda (PBB-P2, BPHTB)' : '2. Kawasan Industri Smelter Bua'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Tersedia</span>
                </div>
                <div className="p-2 rounded-lg flex items-center justify-between transition-colors hover:bg-white/5 cursor-pointer">
                  <span style={{ color: theme.textPrimary }}>
                    {selectedRoute === 'mpp' ? '3. Loket BPJS Ketenagakerjaan' : '3. Agrowisata & Kopi Latimojong'}
                  </span>
                  <span className="text-[11px] font-mono text-sky-400">Prioritas</span>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between items-center text-[10px]" style={{ borderColor: theme.border, color: theme.textSecondary }}>
                <span>Teks di L3 memakai Slate-300 (#CBD5E1)</span>
                <button 
                  onClick={() => setShowModal(true)}
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Modal Demo</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal Dialog Demo for L3 Fullscreen Elevation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl border animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: theme.bgOverlay, borderColor: theme.border }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
                  Dialog Konfirmasi (Elevasi L3 --bg-overlay)
                </h4>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              Modal dialog dan popover popup menggunakan elevasi Layer 3 (#1A4366) dengan border netral <code className="text-emerald-400">rgba(255,255,255,0.09)</code> dan teks pendukung slate-300 untuk menjamin rasio kontras 5.41:1 (Lulus WCAG AA).
            </p>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
                style={{ backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary }}
              >
                Tutup
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                style={{ backgroundColor: theme.btnCtaBg }}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeComparisonPreview;

