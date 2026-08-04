const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');

// Base64 for a tiny valid 1x1 PNG image
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const imageBuffer = Buffer.from(TINY_PNG_BASE64, 'base64');

const filesToCreate = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'favicon.png',
  'notification-icon.png'
];

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR);
  console.log('Created assets directory.');
}

filesToCreate.forEach(file => {
  const filePath = path.join(ASSETS_DIR, file);
  fs.writeFileSync(filePath, imageBuffer);
  console.log(`Generated placeholder asset: assets/${file}`);
});

console.log('All assets generated successfully.');
