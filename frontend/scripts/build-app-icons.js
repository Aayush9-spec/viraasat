// Export deployment-sized PNGs from the approved Viraasat icon artwork.
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');
const root = path.join(__dirname, '..');
async function build() {
  const source = path.join(root, 'public/brand/viraasat-app-master.png');
  const sizes = [48, 72, 96, 128, 144, 152, 180, 192, 384, 512];
  for (const size of sizes) {
    const image = await sharp(source).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(root, `public/icons/viraasat-${size}.png`), image);
    if (![48, 180].includes(size)) fs.writeFileSync(path.join(root, `public/icons/icon-${size}x${size}.png`), image);
  }
  await sharp(source).resize(460, 460).extend({ top: 26, bottom: 26, left: 26, right: 26, background: '#FAF7F2' }).png().toFile(path.join(root, 'public/icons/viraasat-maskable-512.png'));
  // ICO supports a PNG payload; use the same logo rather than the old favicon.
  const png = await sharp(source).resize(48, 48).png().toBuffer();
  const header = Buffer.alloc(22); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = 48; header[7] = 48; header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(root, 'src/app/favicon.ico'), Buffer.concat([header, png]));
  console.log('Exported Viraasat PNG icons, maskable icon and favicon.');
}
build().catch(error => { console.error(error); process.exitCode = 1; });
