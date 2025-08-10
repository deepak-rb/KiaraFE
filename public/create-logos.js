const fs = require('fs');

// Create a simple favicon.ico replacement with SVG
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="16" fill="#10b981"/>
  <text x="16" y="22" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="white">K</text>
</svg>`;

// Create 192x192 logo
const logo192Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <circle cx="96" cy="96" r="96" fill="#10b981"/>
  <circle cx="96" cy="96" r="75" fill="#ffffff" opacity="0.95"/>
  <g transform="translate(96, 96)">
    <rect x="-6" y="-30" width="12" height="60" fill="#10b981" rx="2"/>
    <rect x="-30" y="-6" width="60" height="12" fill="#10b981" rx="2"/>
  </g>
  <text x="96" y="140" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="#10b981">KIARA</text>
  <text x="96" y="155" font-family="Arial" font-size="9" text-anchor="middle" fill="#059669">CLINIC</text>
</svg>`;

// Create 512x512 logo
const logo512Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="256" fill="#10b981"/>
  <circle cx="256" cy="256" r="200" fill="#ffffff" opacity="0.95"/>
  <g transform="translate(256, 256)">
    <rect x="-15" y="-80" width="30" height="160" fill="#10b981" rx="5"/>
    <rect x="-80" y="-15" width="160" height="30" fill="#10b981" rx="5"/>
  </g>
  <text x="256" y="380" font-family="Arial" font-size="42" font-weight="bold" text-anchor="middle" fill="#10b981">KIARA</text>
  <text x="256" y="420" font-family="Arial" font-size="24" text-anchor="middle" fill="#059669">CLINIC</text>
  <circle cx="150" cy="150" r="8" fill="#34d399" opacity="0.6"/>
  <circle cx="362" cy="150" r="8" fill="#34d399" opacity="0.6"/>
  <circle cx="150" cy="362" r="8" fill="#34d399" opacity="0.6"/>
  <circle cx="362" cy="362" r="8" fill="#34d399" opacity="0.6"/>
</svg>`;

// Write the SVG files
fs.writeFileSync('favicon.svg', faviconSvg);
fs.writeFileSync('logo192.svg', logo192Svg);
fs.writeFileSync('logo512.svg', logo512Svg);

console.log('SVG logos created successfully!');
console.log('Files created: favicon.svg, logo192.svg, logo512.svg');
