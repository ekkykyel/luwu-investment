const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

if (!content.includes('Building2,')) {
    content = content.replace('} from "lucide-react";', '  Building2,\n} from "lucide-react";');
}

const targetDesktop = `<motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRequestFullscreen();
                  window.location.href = "/login?role=investor";
                }}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 via-cyan-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 relative overflow-hidden group border border-emerald-300/40"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-1.5">
                  <UserPlus size={15} className="text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>{t("hero.explore", "Login Investor")}</span>
                </span>
              </motion.button>`;

const replacementDesktop = `
              {/* Dropdown Desktop: Registrasi */}
              <div className="relative group hidden md:block">
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 via-cyan-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 relative overflow-hidden border border-emerald-300/40"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-1.5">
                    <UserPlus size={15} className="text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>Registrasi</span>
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="p-2 flex flex-col gap-1">
                    <div className="px-2 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">Registrasi Sebagai:</div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRequestFullscreen();
                        window.location.href = "/register?tab=investor";
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Building2 size={16} /> Investor
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRequestFullscreen();
                        window.location.href = "/register?tab=masyarakat";
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Users size={16} /> Masyarakat
                    </button>
                  </div>
                </div>
              </div>
`;

content = content.replace(targetDesktop, replacementDesktop);

const targetMobile = `<motion.button whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMobileMenuOpen(false);
                      handleRequestFullscreen();
                      window.location.href = "/login?role=investor";
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                  >
                    <UserPlus size={18} className="text-amber-300" />
                    <span>{t("hero.explore", "Login Investor")}</span>
                  </motion.button>`;

const replacementMobile = `
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registrasi Sebagai:</span>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        handleRequestFullscreen();
                        window.location.href = "/register?tab=investor";
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold transition-all border border-emerald-200 dark:border-emerald-500/30"
                    >
                      <Building2 size={16} />
                      <span>Investor</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        handleRequestFullscreen();
                        window.location.href = "/register?tab=masyarakat";
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold transition-all border border-blue-200 dark:border-blue-500/30"
                    >
                      <Users size={16} />
                      <span>Masyarakat</span>
                    </motion.button>
                  </div>
`;

content = content.replace(targetMobile, replacementMobile);

content += '\n// ui polish: update registrasi button to a dropdown with role choices\n';

fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('patched landing page');
