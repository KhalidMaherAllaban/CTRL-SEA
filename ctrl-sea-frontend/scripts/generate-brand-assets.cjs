/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sourceLogo =
  process.argv[2] ||
  "C:/Users/mohamed ellaban/OneDrive - Notley Green Primary School/Desktop/logo one.png";
const publicDir = path.join(__dirname, "..", "public");
const waveSvg = fs.readFileSync(path.join(publicDir, "ctrl-sea-wave.svg"));

async function pngFromSvg(name, size) {
  await sharp(waveSvg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, name));
}

function makeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, buffer }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.buffer)]);
}

async function main() {
  await sharp(sourceLogo)
    .resize(1024, 1024, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "ctrl-sea-logo.png"));

  await sharp(sourceLogo)
    .resize(2048, 2048, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "ctrl-sea-logo@2x.png"));

  await sharp(sourceLogo)
    .resize(512, 512, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "ctrl-sea-seal-512.png"));

  await pngFromSvg("favicon-32x32.png", 32);
  await pngFromSvg("browser-tab-icon.png", 64);
  await pngFromSvg("apple-touch-icon.png", 180);
  await pngFromSvg("pwa-192x192.png", 192);
  await pngFromSvg("pwa-512x512.png", 512);
  await pngFromSvg("app-icon.png", 512);

  const icoImages = [];
  for (const size of [16, 32, 48, 64]) {
    icoImages.push({
      size,
      buffer: await sharp(waveSvg).resize(size, size).png().toBuffer()
    });
  }
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), makeIco(icoImages));

  const ogBackground = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="35%" cy="30%" r="70%">
          <stop stop-color="#082D56"/>
          <stop offset="1" stop-color="#03152D"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect x="32" y="32" width="1136" height="566" rx="28" fill="#03152D" fill-opacity=".54" stroke="#D6A85F" stroke-opacity=".42"/>
      <text x="548" y="286" fill="#F8FAFC" font-size="76" font-family="Arial, sans-serif" font-weight="800" letter-spacing="10">CTRL SEA</text>
      <text x="552" y="350" fill="#D6A85F" font-size="28" font-family="Arial, sans-serif" font-weight="700" letter-spacing="5">MARITIME DATA ANALYTICS</text>
      <text x="554" y="402" fill="#9ADCF2" font-size="25" font-family="Arial, sans-serif">Maritime Intelligence Platform</text>
    </svg>
  `);
  const seal = await sharp(sourceLogo).resize(420, 420, { fit: "cover" }).png().toBuffer();

  await sharp(ogBackground)
    .composite([{ input: seal, left: 88, top: 105 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "ctrl-sea-og.png"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
