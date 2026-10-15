const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

content = content.replace(
`  const handleLaunchApp = () => {
    // This is called when the user taps after ready
    handleRequestFullscreen();
    setShowLauncher(false);
  };`,
`  const handleLaunchApp = () => {
    // This is called when the user taps after ready
    if (isMobile) {
      handleRequestFullscreen();
    }
    setShowLauncher(false);
  };`
);

content = content.replace(
`    const handleFirstInteraction = () => {
      if (!hasTriggeredInitialFullscreen.current && !document.fullscreenElement) {
        hasTriggeredInitialFullscreen.current = true;
        handleRequestFullscreen();
      }
    };`,
`    const handleFirstInteraction = () => {
      if (isMobile && !hasTriggeredInitialFullscreen.current && !document.fullscreenElement) {
        hasTriggeredInitialFullscreen.current = true;
        handleRequestFullscreen();
      }
    };`
);

content = content.replace(
`                    <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm tracking-wider uppercase animate-pulse flex items-center gap-2">
                       <Maximize2 className="w-4 h-4" />
                       Ketuk Layar Untuk Memulai
                    </div>`,
`                    <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm tracking-wider uppercase animate-pulse flex items-center gap-2">
                       {isMobile ? <Maximize2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                       {isMobile ? "Ketuk Layar Untuk Memulai" : "Masuk Ke Sistem"}
                    </div>`
);

fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log("Done fixing PWA launch");
