/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  rules: {
    'no-unused-vars': 'off',
  },
  ignorePatterns: ['build/', 'dist/', 'target/', 'standalone/dist/', 'node_modules/'],
};
