const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// replace everything after the CTA login section
const ctaMarker = '{/* CTA LOGIN INVESTOR POST ROI SIMULATOR */}';
const index = code.indexOf(ctaMarker);
if (index !== -1) {
    code = code.substring(0, index);
    code += `        {/* CTA LOGIN INVESTOR POST ROI SIMULATOR */}
        <div className="container max-w-7xl mx-auto px-4 lg:px-6 mb-16">
          <div className="flex justify-center w-full">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleRequestFullscreen();
                navigate("/login?role=investor");
              }}
              className="px-8 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 ease-out flex items-center justify-center gap-2.5 group bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 border-emerald-400/40"
            >
              <UserPlus size={19} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 text-amber-300" />
              <span>{t("landing.loginInvestor", "Login Investor")}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
`;
    fs.writeFileSync('src/components/LandingPage.tsx', code);
    console.log('Fixed');
}
