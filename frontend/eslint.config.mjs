import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
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
];
