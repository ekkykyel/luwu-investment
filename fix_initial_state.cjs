const fs = require('fs');
let code = fs.readFileSync('src/components/PortalMPP.tsx', 'utf8');

code = code.replace(
  /const \[liveAgencies, setLiveAgencies\] = useState<any\[\]>\(LOCALIZED_AGENCIES\);/,
  `const [liveAgencies, setLiveAgencies] = useState<any[]>([]);`
);

code = code.replace(
  /const \[liveReviews, setLiveReviews\] = useState<any\[\]>\(LOCALIZED_REVIEWS\);/,
  `const [liveReviews, setLiveReviews] = useState<any[]>([]);`
);

fs.writeFileSync('src/components/PortalMPP.tsx', code);
console.log('fixed initial states');
