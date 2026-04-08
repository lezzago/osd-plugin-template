/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  projects: [
    // Server-side and core tests (node environment)
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/core', '<rootDir>/server'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: false }],
      },
      moduleNameMapper: {
        '^.*/src/core/server$': '<rootDir>/stubs/src/core/server/stub.js',
      },
    },
    // React component tests (jsdom environment)
    {
      displayName: 'components',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/public'],
      testMatch: ['**/__tests__/**/*.test.tsx'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: false }],
      },
      moduleNameMapper: {
        '^.*/src/core/public$': '<rootDir>/public/__mocks__/osd_core.ts',
        '^.*/src/plugins/navigation/public$': '<rootDir>/public/__mocks__/osd_navigation.ts',
        '^@elastic/eui$': '<rootDir>/public/__mocks__/eui_mock.tsx',
        '^@opensearch-project/oui$': '<rootDir>/public/__mocks__/eui_mock.tsx',
        '^moment$': '<rootDir>/public/__mocks__/style_mock.ts',
        '\\.(css|scss)$': '<rootDir>/public/__mocks__/style_mock.ts',
      },
    },
  ],
  collectCoverageFrom: [
    'core/**/*.ts',
    'server/**/*.ts',
    'public/**/*.{ts,tsx}',
    '!public/plugin.ts',
    '!public/application.tsx',
    '!public/types.ts',
    '!public/components/app.tsx',
    '!server/plugin.ts',
    '!core/mock_data.ts',
    '!**/index.ts',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
