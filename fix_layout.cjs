const fs = require('fs');
let code = fs.readFileSync('src/components/PortalMPP.tsx', 'utf8');

// 1 & 2 & 3. Update motion.section classNames
code = code.replace(/<motion\.section([\s\S]*?)className="([^"]*)"/g, (match, p1, p2) => {
  let classes = p2;
  
  // Apply standard width and mx-auto
  classes = classes.replace(/\bw-full\b/g, '');
  classes = classes.replace(/\bmax-w-[a-zA-Z0-9-]+\b/g, '');
  classes = classes.replace(/\bmx-auto\b/g, '');
  
  // Remove existing padding x
  classes = classes.replace(/\bpx-\d+\b/g, '');
  classes = classes.replace(/\bsm:px-\d+\b/g, '');
  classes = classes.replace(/\bmd:px-\d+\b/g, '');
  classes = classes.replace(/\blg:px-\d+\b/g, '');
  
  // Remove existing space-y
  classes = classes.replace(/\bspace-y-\d+\b/g, '');
  classes = classes.replace(/\bsm:space-y-\d+\b/g, '');

  // Add the new width and padding
  classes = `w-[95%] sm:w-[90%] lg:w-[85%] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6 ${classes}`.replace(/\s+/g, ' ').trim();
  
  return `<motion.section${p1}className="${classes}"`;
});

// Fix any double widths if present
code = code.replace(/w-\[95\%\] sm:w-\[90\%\] lg:w-\[85\%\] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6\s+w-\[95\%\]/g, 'w-[95%] sm:w-[90%] lg:w-[85%] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6');

// Wait, the Ulasan Masyarakat section (line 3281) has a background directly on it: `bg-slate-900/90`. 
// If it has `w-[95%]`, it won't be full width edge-to-edge. 
// "Ubah wrapper pada seluruh seksi (Pelayanan Magatti, Grafik, Instansi, Layanan, Fasilitas, Pengaduan, Helpdesk, Alur, Berita, Statistik, Kontak, Sosmed) menjadi w-[95%] sm:w-[90%] lg:w-[85%] mx-auto. Kita kunci kesimetrisan ini secara global."
// The user says "seluruh seksi (...)". It seems they want it everywhere, but for Ulasan we might need to be careful if it ruins its edge-to-edge dark background. 
// However, the instruction explicitly says:
// "Ubah wrapper pada seluruh seksi ... agar menggunakan pola grid yang sama dengan 'TESTIMONI WARGA'. Gunakan kelas 'w-[95%] sm:w-[90%] lg:w-[85%] mx-auto' agar semua komponen memiliki lebar yang simetris di layar mobile dan desktop."
// Wait, TESTIMONI WARGA (Ulasan) ALREADY has this? Let's check Ulasan container!

fs.writeFileSync('src/components/PortalMPP.tsx', code);
