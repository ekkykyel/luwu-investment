const fs = require('fs');
const content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /<section id="hero-section"/;
const match = content.match(regex);
console.log(match ? "Found hero section" : "Not found");
