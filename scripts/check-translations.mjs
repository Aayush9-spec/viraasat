/**
 * i18n lint: detects translation gaps before launch.
 *
 * Usage:  node scripts/check-translations.mjs
 *
 * Flags keys whose value in a non-English locale is *identical* to the
 * English source value, meaning the locale still falls back silently to
 * English at runtime. This is a heuristic (exact-match only); paraphrased
 * English won't be caught — a human review is still required before launch
 * for the bh/ ta/ te fallbacks.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, '..', 'frontend', 'src', 'locales');
const ENGLISH = 'en.json';

function readJson(name) {
  return JSON.parse(readFileSync(resolve(LOCALES_DIR, name), 'utf8'));
}

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return { ...acc, ...flatten(v, key) };
    }
    return { ...acc, [key]: String(v) };
  }, {});
}

function diff(en, locale) {
  const flatEn = flatten(en);
  const flatLo = flatten(locale);
  const result = [];
  for (const k of Object.keys(flatEn)) {
    if (flatLo[k] === undefined) {
      result.push({ key: k, status: 'MISSING' });
    } else if (flatLo[k] === flatEn[k]) {
      result.push({ key: k, status: 'UNTRANSLATED' });
    }
  }
  return result;
}

function main() {
  const en = readJson(ENGLISH);
  const flatEn = flatten(en);
  const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  let hasFailures = false;

  for (const file of files) {
    if (file === ENGLISH) continue;
    const locale = readJson(file);
    const un = diff(en, locale);
    const missing = un.filter((u) => u.status === 'MISSING');
    console.log(`${file}: ${un.length} untranslated/missing of ${Object.keys(flatEn).length} keys`);
    un.slice(0, 15).forEach((u) => console.log(`  ${u.status}: ${u.key}`));
    if (un.length > 15) console.log(`  ...and ${un.length - 15} more`);
    if (missing.length > 0) {
      hasFailures = true;
      console.error(`\n❌ ${file} is missing ${missing.length} keys present in en.json`);
    }
  }

  if (hasFailures) {
    console.error('\nFix missing keys in locale files before launch.');
    process.exit(1);
  }
  console.log('\n✅ No missing keys. UNTRANSLATED entries need a native-speaker review — a heuristic cannot validate meaning.');
}

main();
