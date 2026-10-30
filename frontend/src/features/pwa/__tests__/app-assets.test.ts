/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
test('every advertised manifest icon is a real PNG with the declared dimensions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.json'), 'utf8'));
  expect(manifest.name).toBe('Viraasat'); expect(manifest.id).toBe('/'); expect(manifest.start_url).toBe('/');
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of [...manifest.icons, ...manifest.shortcuts.flatMap((shortcut: { icons: unknown[] }) => shortcut.icons)]) {
    const data = fs.readFileSync(path.join(root, 'public', icon.src));
    expect(data.subarray(0, 8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
    expect(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`).toBe(icon.sizes);
  }
  expect(manifest.shortcuts.find((shortcut: { short_name: string }) => shortcut.short_name === 'Studio').url).toBe('/artisan/dashboard');
});
test('APK download is offered only when a matching nonempty release artifact is present', () => {
  const release = JSON.parse(fs.readFileSync(path.join(root, 'src/config/android-release.json'), 'utf8'));
  if (release.available) {
    const file = fs.readFileSync(path.join(root, 'public', release.url));
    expect(file.length).toBe(release.bytes);
    expect(require('node:crypto').createHash('sha256').update(file).digest('hex')).toBe(release.sha256);
  } else {
    expect(fs.existsSync(path.join(root, 'public/download/viraasat.apk'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'public/viraasat.apk'))).toBe(false);
  }
});
