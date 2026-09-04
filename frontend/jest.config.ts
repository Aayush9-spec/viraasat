// jest.config.ts
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/**
 * Custom Jest configuration for the Viraasat frontend.
 * Uses next/jest to automatically apply Next.js Babel/TS settings.
 */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { 
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map lucide-react to a mock to avoid ES module issues
    'lucide-react$': '<rootDir>/src/mocks/lucide-mock.ts',
  },
  // e2e specs run under Playwright, not Jest (they import @playwright/test).
  // macOS AppleDouble resource forks (._*) are also ignored: this checkout
  // lives on a filesystem that regenerates them on file access.
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '<rootDir>/tests/e2e/', '\\._'],
  // Collect coverage to ensure core components are tested
  collectCoverage: true,
  coverageDirectory: 'coverage',
};

export default createJestConfig(customJestConfig);
