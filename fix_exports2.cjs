const fs = require('fs');
let code = fs.readFileSync('src/components/PortalMPP.tsx', 'utf8');

code = code.replace(
  /export const liveReviews = LOCALIZED_REVIEWS;\nexport const liveReviews = liveReviews;/,
  `export const liveReviews = LOCALIZED_REVIEWS;`
);

fs.writeFileSync('src/components/PortalMPP.tsx', code);
console.log('fixed exports 2');
