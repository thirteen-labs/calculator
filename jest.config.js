/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/scripts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          paths: {
            '@/*': ['./src/*'],
            '@/assets/*': ['./assets/*'],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    // Ships as untranspiled ESM, and only installs the SQLite-backed
    // `localStorage` on native. Node tests inject their own `localStorage`
    // stub, so stubbing the side-effecting install out is both accurate and
    // keeps the calc tests running on a plain node environment.
    '^expo-sqlite/localStorage/install$': '<rootDir>/src/testing/noop-module.js',
  },
  collectCoverageFrom: [
    'src/calc/**/*.ts',
    '!src/calc/index.ts',
    '!src/calc/engine/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
};
