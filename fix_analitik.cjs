const fs = require('fs');
let code = fs.readFileSync('src/components/AnalitikSpasialSection.tsx', 'utf8');

// The remaining broken fragment starts with:
const searchString = `                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                      {t("labor_absorption_metrics", "Serapan Tenaga Kerja")}
                    </h3>`;

const index = code.indexOf(searchString);
if (index !== -1) {
    let endStr = `              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};`;
    const endIndex = code.indexOf(endStr, index);
    if (endIndex !== -1) {
        code = code.substring(0, index) + `          </div>
        </div>
      </div>
    </>
  );
};
`;
        fs.writeFileSync('src/components/AnalitikSpasialSection.tsx', code);
        console.log('Fixed');
    } else {
        console.log('End not found');
    }
} else {
    console.log('Start not found');
}
