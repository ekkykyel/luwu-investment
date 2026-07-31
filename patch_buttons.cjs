const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{/* The horizontal buttons have been moved to the AdminSidebar layout component */}`;
const replacement = `<div className="flex gap-2 flex-wrap justify-end">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Plus className="h-4 w-4" /> Tambah Investasi
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveWorkspace("SPATIAL_EDITOR"); setSpatialEditorModule("INVESTASI"); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold font-sans rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Map className="h-4 w-4" /> Kelola GIS
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoiTicketsModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-sans rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Ticket className="h-4 w-4" /> Tiket LoI
              </motion.button>
              {currentRole === Role.SUPER_ADMIN && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreateOperatorModalOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold font-sans rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <UserPlus className="h-4 w-4" /> Tambah Operator
                </motion.button>
              )}
            </div>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success replacing buttons");
} else {
    console.log("Target not found");
}
