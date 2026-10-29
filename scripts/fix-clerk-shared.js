const fs = require('fs');
const path = require('path');

const clerkSharedDir = path.resolve(__dirname, '../frontend/node_modules/@clerk/shared');

if (fs.existsSync(clerkSharedDir)) {
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
          // Create wrapper for ESM import compatibility
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
}
