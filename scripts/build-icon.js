const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'icon.svg'));

sharp(svg, { density: 512 })
  .resize(128, 128)
  .png()
  .toFile(path.join(root, 'icon.png'))
  .then(() => console.log('icon.png 128x128 built'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
