import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'node_modules/**',
      'out/**',
      'public/**',
      'next-env.d.ts',
      'sentry.client.config.ts',
      'sentry.server.config.ts',
      '**/._*',
      '**/*.d.ts',
      'eslint.config.mjs',
      'postcss.config.mjs',
      'tailwind.config.ts',
    ],
  },
  {
    // Rule overrides. Some of these are intentionally relaxed because fixing
    // them is a separate, larger refactor; the project still lints and
    // surfaces genuine logic bugs (see the strict rules below).
    rules: {
      'react/no-unescaped-entities': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Migrated away from raw <img> in the consumer components; remaining
      // occurrences (PWA icon previews, dynamic blob URLs) are kept via
      // targeted inline disables in src/app/pwa-test/page.tsx.
      '@next/next/no-img-element': 'error',
      // The following rules from eslint-config-next flag patterns that need
      // a real refactor of the offending files. Documented as a known TODO
      // in docs/secrets.md and tracked separately.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
];
