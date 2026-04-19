/**
 * Generate PNG icon variants from SVG for PWA.
 * Outputs: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
 * Run: node scripts/gen-icons.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IN_MAIN = path.join(ROOT, 'public/icons/icon.svg');
const IN_MASK = path.join(ROOT, 'public/icons/icon-maskable.svg');
const OUT = path.join(ROOT, 'public/icons');

async function render(input, size, filename) {
  const buf = await fs.readFile(input);
  const out = path.join(OUT, filename);
  await sharp(buf, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('✓', filename, `(${size}x${size})`);
}

await render(IN_MAIN, 192, 'icon-192.png');
await render(IN_MAIN, 512, 'icon-512.png');
await render(IN_MASK, 512, 'icon-maskable-512.png');
await render(IN_MAIN, 180, 'apple-touch-icon.png');
await render(IN_MAIN, 32, 'favicon-32.png');

console.log('\nPWA icons generated in public/icons/');
