/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom Cypress commands

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Ensure the app is loaded. In standalone mode, visits '/'.
       * In OSD mode, navigates to the plugin app.
       */
      ensureLoaded(): Chainable<void>;
    }
  }
}

const isOsd = Cypress.env('MODE') === 'osd';

Cypress.Commands.add('ensureLoaded', () => {
  if (isOsd) {
    const workspaceId = Cypress.env('OSD_WORKSPACE_ID') || '';
    const basePath = workspaceId ? `/w/${workspaceId}` : '';
    cy.visit(`${basePath}/app/myPlugin`);
  } else {
    cy.visit('/');
  }
  cy.contains('Notes', { timeout: 15000 }).should('be.visible');
});

export {};
