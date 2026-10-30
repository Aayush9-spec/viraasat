// Cache version depends on canonical worker + offline assets, not its previous
// generated version. Repeated builds with unchanged inputs are deterministic.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const publicDir = path.join(__dirname, '..', 'public');
const swPath = path.join(publicDir, 'sw.js');
const marker = '/* CACHE_NAME_INJECTED */';
const assets = ['offline.html', 'offline-retry.js', 'icons/viraasat-192.png'];
function canonicalSource(source) {
  return source.replace(/const CACHE_NAME\s*=\s*["'][^"']*["'];?/, marker);
}
function build() {
  const canonical = canonicalSource(fs.readFileSync(swPath, 'utf8'));
  if (!canonical.includes(marker)) throw new Error('Missing service worker cache marker');
  const hash = crypto.createHash('sha256').update(canonical);
  for (const asset of assets) hash.update(asset).update(fs.readFileSync(path.join(publicDir, asset)));
  const version = hash.digest('hex').slice(0, 12);
  fs.writeFileSync(swPath, canonical.replace(marker, `const CACHE_NAME = "viraasat-${version}";`));
  console.log(`[build-sw] Cache version ${version}`);
}
if (require.main === module) build();
module.exports = { build, canonicalSource };
