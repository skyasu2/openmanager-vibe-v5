import sharp from 'sharp';

// SVG 아이콘 템플릿
const createSvg = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#EC4899"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.35}"
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">OM</text>
</svg>
`;

async function createIcons() {
  console.log('Creating PWA icons...');

  // 192x192
  await sharp(Buffer.from(createSvg(192)))
    .png()
    .toFile('public/icon-192.png');
  console.log('  ✅ icon-192.png created');

  // 512x512
  await sharp(Buffer.from(createSvg(512)))
    .png()
    .toFile('public/icon-512.png');
  console.log('  ✅ icon-512.png created');

  // 96x96 for shortcuts
  await sharp(Buffer.from(createSvg(96)))
    .png()
    .toFile('public/dashboard-icon.png');
  console.log('  ✅ dashboard-icon.png created');

  await sharp(Buffer.from(createSvg(96)))
    .png()
    .toFile('public/ai-icon.png');
  console.log('  ✅ ai-icon.png created');

  console.log('\n✅ All PWA icons created successfully!');
}

createIcons().catch(console.error);
