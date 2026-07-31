const fs = require('fs');

const makePremium = (filepath) => {
  if (fs.existsSync(filepath)) {
    let code = fs.readFileSync(filepath, 'utf8');
    code = code.replace(
      /className="bg-white\/60 dark:bg-slate-900\/40 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700\/50 p-5 backdrop-blur-md"/,
      `className="bg-white/80 dark:bg-slate-900/60 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 p-5 backdrop-blur-xl"`
    );
    fs.writeFileSync(filepath, code);
  }
}

makePremium('src/components/SystemLogsWidget.tsx');
makePremium('src/components/AuditLogDashboard.tsx');
console.log("Logs widgets styling fixed.");
