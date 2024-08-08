import * as dotenv from 'dotenv';

dotenv.config();

/* eslint-disable */
export default {
  displayName: 'pg-migration',
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: './dist/coverage',
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coveragePathIgnorePatterns: ['/node_modules/', 'index.ts', 'stub.ts'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
