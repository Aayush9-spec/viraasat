// jest.config.ts
import nextJest from 'next/jest';

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
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  // Collect coverage to ensure core components are tested
  collectCoverage: true,
  coverageDirectory: 'coverage',
};

export default createJestConfig(customJestConfig);
