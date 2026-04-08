/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Notes CRUD', () => {
  beforeEach(() => {
    cy.ensureLoaded();
  });

  it('displays the notes page', () => {
    cy.contains('Notes').should('be.visible');
  });

  it('shows the create note button', () => {
    cy.get('[data-test-subj="createNoteButton"]').should('be.visible');
  });

  it('creates a new note', () => {
    cy.get('[data-test-subj="createNoteButton"]').click();
    cy.get('[data-test-subj="noteTitleInput"]').type('Test Note');
    cy.get('[data-test-subj="noteContentInput"]').type('This is test content');
    cy.get('[data-test-subj="saveNoteButton"]').click();
    cy.contains('Test Note').should('be.visible');
  });

  it('shows existing notes in the table', () => {
    // In MOCK_MODE, there should be seeded notes
    cy.get('[data-test-subj="notesTable"]').should('exist');
  });

  it('can cancel note creation', () => {
    cy.get('[data-test-subj="createNoteButton"]').click();
    cy.get('[data-test-subj="cancelNoteButton"]').click();
    cy.get('[data-test-subj="noteTitleInput"]').should('not.exist');
  });
});
