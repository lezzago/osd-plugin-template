/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'cypress';

const isOsd = process.env.CYPRESS_MODE === 'osd';

export default defineConfig({
  e2e: {
    baseUrl: isOsd ? 'http://localhost:5601' : 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1400,
    viewportHeight: 900,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    testIsolation: !isOsd,
    numTestsKeptInMemory: isOsd ? 0 : 50,
  },
});
