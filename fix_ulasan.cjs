const fs = require('fs');
let code = fs.readFileSync('src/components/PortalMPP.tsx', 'utf8');

// The ulasan section currently has:
// className="w-[95%] sm:w-[90%] lg:w-[85%] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6 relative bg-slate-900/90 overflow-hidden rounded-t-[2.5rem] md:rounded-t-[4rem] md: py-12 sm:py-16 md:py-24"
// Let's restore it to w-full so it's edge-to-edge as before, because Testimoni Warga was the baseline.
code = code.replace(
  /className="w-\[95\%\] sm:w-\[90\%\] lg:w-\[85\%\] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6 relative bg-slate-900\/90 overflow-hidden rounded-t-\[2\.5rem\] md:rounded-t-\[4rem\] md: py-12 sm:py-16 md:py-24"/g,
  'className="w-full relative bg-slate-900/90 overflow-hidden rounded-t-[2.5rem] md:rounded-t-[4rem] py-12 sm:py-16 md:py-24"'
);

fs.writeFileSync('src/components/PortalMPP.tsx', code);
