// Build-time script: rewrites public/sw.js so CACHE_NAME includes a short
// hash of the current build. Run automatically as a `prebuild` and `predev`
// step in package.json, or invoke manually with `node scripts/build-sw.js`.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');

function shortHash() {
  // Prefer a real build id from the env (Vercel/Render set COMMIT_REF or
  // VERCEL_GIT_COMMIT_SHA); fall back to a content hash of the SW source.
  const ref =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.COMMIT_REF ||
    process.env.GIT_COMMIT ||
    null;
  if (ref) return ref.slice(0, 8);
  const src = fs.readFileSync(swPath, 'utf8');
  return crypto.createHash('sha256').update(src).digest('hex').slice(0, 8);
}

function build() {
  const original = fs.readFileSync(swPath, 'utf8');
  if (!original.includes('/* CACHE_NAME_INJECTED */') && !/const CACHE_NAME\s*=/.test(original)) {
    console.error('sw.js is missing the CACHE_NAME marker; aborting.');
    process.exit(1);
  }

  const hash = shortHash();
  const cacheName = `viraasat-${hash}`;

  // Re-inject from the canonical source on every run: undo the previous
  // `const CACHE_NAME = "viraasat-..."` line and replace the marker.
  const restored = original.replace(
    /\n?const CACHE_NAME\s*=\s*["'][^"']*["'];?\n?/,
    '\n/* CACHE_NAME_INJECTED */\n',
  );
  const finalSrc = restored.replace(
    '/* CACHE_NAME_INJECTED */',
    `const CACHE_NAME = ${JSON.stringify(cacheName)};`,
  );

  fs.writeFileSync(swPath, finalSrc);
  console.log(`[build-sw] CACHE_NAME -> ${cacheName}`);

  // Emit the build id so the client registration can append it as a query
  // string. This forces the browser to re-install the SW on each deploy.
  const out = path.join(__dirname, '..', '.next', 'sw-build-id.txt');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, hash);
}

if (require.main === module) build();

module.exports = { build };
