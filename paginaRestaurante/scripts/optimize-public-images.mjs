// Run after installing the API dependencies: node scripts/optimize-public-images.mjs
// Original photos and full-size images are retained for the dish preview.
import { createRequire } from 'node:module';
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../server/package.json', import.meta.url));
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const photos = ['lomo_saltado','ceviche_de_pescado','arroz_con_mariscos','trio_ceviche_huancaina_arroz_pollo','aji_de_gallina','tarta_chocolate'];
let before = 0, after = 0;
for (const name of photos) {
  const base = root + 'public/assets/images/' + name;
  before += (await stat(base + '-card.webp')).size;
  const result = await sharp(base + '.png').rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 }).toFile(base + '-preview.webp');
  after += result.size;
}
console.log(`Miniaturas: ${before} → ${after} bytes`);
for (const name of await readdir(root + 'src/assets/hero')) {
  if (!name.endsWith('.webp') || name.includes('-mobile')) continue;
  await sharp(root + 'src/assets/hero/' + name).resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 76, effort: 6 }).toFile(root + 'src/assets/hero/' + name.replace('.webp','-mobile-light.webp'));
}
await sharp(root + 'public/assets/images/logo-elperuanojofemar-display.png')
  .resize({ width: 528, withoutEnlargement: true }).webp({ lossless: true, effort: 6 })
  .toFile(root + 'public/assets/images/logo-elperuanojofemar-display.webp');
