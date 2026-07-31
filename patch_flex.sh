cat << 'INNER_EOF' > /tmp/patch_flex.js
const fs = require('fs');
let lp = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

lp = lp.replace(
  /className={\`mt-3 md:mt-0 w-full md:w-auto flex md:inline-flex justify-center md:ml-auto flex items-center/g,
  'className={`mt-3 md:mt-0 w-full md:w-auto flex justify-center md:ml-auto items-center'
);

// We should also remove extreme padding on mobile to give more space inside the card.
lp = lp.replace(
  /className="lg:col-span-12 p-3 sm:p-6 md:p-8 rounded-2xl md:rounded-\[2rem\] border/g,
  'className="lg:col-span-12 p-2 sm:p-6 md:p-8 !px-3 sm:!px-6 md:!px-8 rounded-2xl md:rounded-[2rem] border overflow-hidden'
);

fs.writeFileSync('src/components/LandingPage.tsx', lp);

INNER_EOF
node /tmp/patch_flex.js
