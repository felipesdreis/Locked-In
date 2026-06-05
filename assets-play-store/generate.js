'use strict';

const path = require('path');
const sharp = require('sharp');

// -- ICON 512×512 ──────────────────────────────────────────────────────────────
// Faithful ÷2 scale of resources/icon.svg (original 1024×1024)
// rx=116 preserves the 232/1024 corner-radius ratio
// r=104 / stroke-width=46 halve the original r=208 / stroke-width=92

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="116" fill="#121212"/>
  <circle cx="256" cy="256" r="150" stroke="#F5F5F5" stroke-opacity="0.05" stroke-width="3" fill="none"/>
  <line x1="71" y1="394" x2="441" y2="394" stroke="#F5F5F5" stroke-opacity="0.05" stroke-width="3"/>
  <circle cx="256" cy="256" r="104" fill="none" stroke="#D84315" stroke-width="46"/>
</svg>`;

// -- FEATURE GRAPHIC 1024×500 ──────────────────────────────────────────────────
// Wordmark compound path — verbatim from logos/Locked In Logo (LOCKEDIN, vetor).svg
// All 8 letters (L O C K E D I N) share one <path>; the "O" is a separate <circle>
// Original coordinate space: viewBox "33 35 451 100"
// Placed via transform="translate(47, 140)" → top-left corner lands at (80, 175)

const WM_PATH = [
  // L
  'M39.33 132L39.33 41L53.63 41L53.63 119L77.16 119L77.16 132L39.33 132Z',
  // C
  'M175.70 133.30Q165.43 133.30 160.03 127.45Q154.64 121.60 154.64 110.94L154.64 110.94' +
  'L154.64 62.06Q154.64 51.40 160.03 45.55Q165.43 39.70 175.70 39.70L175.70 39.70' +
  'Q185.97 39.70 191.37 45.55Q196.76 51.40 196.76 62.06L196.76 62.06L196.76 71.68' +
  'L183.24 71.68L183.24 61.15Q183.24 52.70 176.09 52.70L176.09 52.70' +
  'Q168.94 52.70 168.94 61.15L168.94 61.15L168.94 111.98' +
  'Q168.94 120.30 176.09 120.30L176.09 120.30Q183.24 120.30 183.24 111.98' +
  'L183.24 111.98L183.24 98.07L196.76 98.07L196.76 110.94' +
  'Q196.76 121.60 191.37 127.45Q185.97 133.30 175.70 133.30L175.70 133.30Z',
  // K
  'M215.09 132L215.09 41L229.39 41L229.39 79.35L247.59 41L261.89 41' +
  'L244.86 74.41L262.15 132L247.20 132L235.11 91.44L229.39 103.01L229.39 132L215.09 132Z',
  // E
  'M278.66 132L278.66 41L317.66 41L317.66 54L292.96 54L292.96 78.05' +
  'L312.59 78.05L312.59 91.05L292.96 91.05L292.96 119L317.66 119L317.66 132L278.66 132Z',
  // D (outer + inner counter, both subpaths in one compound path)
  'M335.60 132L335.60 41L357.44 41Q368.10 41 373.43 46.72Q378.76 52.44 378.76 63.49' +
  'L378.76 63.49L378.76 109.51Q378.76 120.56 373.43 126.28Q368.10 132 357.44 132' +
  'L357.44 132L335.60 132Z' +
  'M349.90 119L357.18 119Q360.69 119 362.57 116.92Q364.46 114.84 364.46 110.16' +
  'L364.46 110.16L364.46 62.84Q364.46 58.16 362.57 56.08Q360.69 54 357.18 54' +
  'L357.18 54L349.90 54L349.90 119Z',
  // I
  'M398.13 132L398.13 41L412.43 41L412.43 132L398.13 132Z',
  // N
  'M432.84 132L432.84 41L450.78 41L464.69 95.47L464.95 95.47L464.95 41' +
  'L477.69 41L477.69 132L463.00 132L445.84 65.57L445.58 65.57L445.58 132L432.84 132Z',
].join(' ');

const FEATURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <radialGradient id="glow" cx="86%" cy="50%" r="52%">
      <stop offset="0%" stop-color="#D84315" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#D84315" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Solid background -->
  <rect width="1024" height="500" fill="#121212"/>

  <!-- Warm orange glow — right side, behind ring -->
  <rect width="1024" height="500" fill="url(#glow)"/>

  <!-- Court texture watermark — 4.2% opacity, right zone -->
  <g stroke="#F5F5F5" stroke-opacity="0.042" fill="none" stroke-width="4">
    <path d="M 744 500 A 320 320 0 0 1 1024 154"/>
    <circle cx="880" cy="250" r="112"/>
    <rect x="808" y="198" width="216" height="302"/>
    <line x1="808" y1="198" x2="1024" y2="198"/>
  </g>

  <!-- Basketball ring — right zone, bleeds off right/top/bottom edges -->
  <circle cx="880" cy="250" r="220" fill="none" stroke="#D84315" stroke-width="96"/>

  <!-- LOCKEDIN wordmark — verbatim paths from logos/Locked In Logo (LOCKEDIN, vetor).svg -->
  <!-- translate(47,140) shifts original origin (33,35) → (80,175) in feature graphic   -->
  <!-- Wordmark bounding box: x 80–531, y 175–275                                        -->
  <g transform="translate(47, 140)" fill="#F5F5F5">
    <path d="${WM_PATH}"/>
    <circle cx="114.5" cy="86" r="35.1" fill="none" stroke="#D84315" stroke-width="15.6"/>
  </g>

  <!-- Tagline -->
  <text x="80" y="310"
        font-family="'Segoe UI', system-ui, -apple-system, Arial, sans-serif"
        font-size="20" font-weight="400"
        fill="#F5F5F5" fill-opacity="0.55"
        letter-spacing="0.3">Construa h&#xe1;bitos. Mantenha a sequ&#xea;ncia.</text>
</svg>`;

async function main() {
  const outDir = __dirname;

  await sharp(Buffer.from(ICON_SVG))
    .flatten({ background: '#121212' })
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/icon-512.png`);
  console.log('icon-512.png  512x512');

  await sharp(Buffer.from(FEATURE_SVG))
    .flatten({ background: '#121212' })
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/feature-graphic.png`);
  console.log('feature-graphic.png  1024x500');

  console.log('\nDone.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
