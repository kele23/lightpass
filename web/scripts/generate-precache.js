import fs from 'fs';
import path from 'path';

/**
 * Scansiona la cartella .output/public per trovare tutti gli asset da precaricare nel Service Worker.
 * Questo script viene eseguito dopo il build (postbuild).
 */

const PUBLIC_DIR = path.join(process.cwd(), '.output/public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'precache-manifest.json');

function getFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, baseDir));
    } else {
      // Ignoriamo file di sistema o metadati di Nitro/Cloudflare
      const relativePath = '/' + path.relative(baseDir, filePath).replace(/\\/g, '/');
      if (
        !relativePath.includes('_headers') &&
        !relativePath.includes('sw.js') &&
        !relativePath.includes('precache-manifest.json') &&
        !relativePath.includes('wrangler.json') &&
        !relativePath.includes('.DS_Store')
      ) {
        results.push(relativePath);
      }
    }
  });
  return results;
}

try {
  console.log('Generating precache manifest from:', PUBLIC_DIR);
  const assets = getFiles(PUBLIC_DIR);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(assets, null, 2));
  console.log(`Precache manifest generated with ${assets.length} assets at ${OUTPUT_FILE}`);
} catch (error) {
  console.error('Failed to generate precache manifest:', error);
  process.exit(1);
}
