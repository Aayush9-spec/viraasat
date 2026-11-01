const fs = require('fs');
const path = require('path');

const candidates = [
  path.resolve(__dirname, '../node_modules/@clerk/shared'),
  path.resolve(__dirname, '../../frontend/node_modules/@clerk/shared'),
  path.resolve(__dirname, '../frontend/node_modules/@clerk/shared'),
  path.resolve(process.cwd(), 'node_modules/@clerk/shared'),
  path.resolve(process.cwd(), 'frontend/node_modules/@clerk/shared'),
];

let clerkSharedDir = null;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    clerkSharedDir = cand;
    break;
  }
}

if (!clerkSharedDir) {
  console.log('[fix-clerk-shared] @clerk/shared not found in candidate paths. Skipping patch.');
  process.exit(0);
}

try {
  const pkgJsonPath = path.join(clerkSharedDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const raw = fs.readFileSync(pkgJsonPath, 'utf8');
    if (raw.includes('.mjs')) {
      const fixed = raw.replace(/\.mjs/g, '.js');
      fs.writeFileSync(pkgJsonPath, fixed, 'utf8');
      console.log('[fix-clerk-shared] Updated @clerk/shared package.json exports to .js');
    }
  }

  const distDir = path.join(clerkSharedDir, 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    let createdCount = 0;
    for (const f of files) {
      if (f.endsWith('.js') && !f.endsWith('.d.ts')) {
        const mjsName = f.slice(0, -3) + '.mjs';
        const mjsPath = path.join(distDir, mjsName);
        if (!fs.existsSync(mjsPath)) {
          const baseName = path.basename(f);
          const wrapperContent = `import * as cjsModule from './${baseName}';\nconst _default = cjsModule.default || cjsModule;\nexport default _default;\nexport * from './${baseName}';\n`;
          fs.writeFileSync(mjsPath, wrapperContent, 'utf8');
          createdCount++;
        }
      }
    }
    if (createdCount > 0) {
      console.log(`[fix-clerk-shared] Created ${createdCount} .mjs wrappers in @clerk/shared/dist`);
    }
  }
} catch (err) {
  console.warn('[fix-clerk-shared] Error patching @clerk/shared:', err.message);
}

