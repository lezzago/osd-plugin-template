/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryNoteStore } from '../../core/note_store';
import { NoteService } from '../../core/note_service';
import { Logger } from '../../core/types';
import {
  handleGetNotes,
  handleGetNote,
  handleCreateNote,
  handleUpdateNote,
  handleDeleteNote,
} from '../routes/handlers';

function createMockLogger(): Logger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

function createService(): NoteService {
  const store = new InMemoryNoteStore();
  const logger = createMockLogger();
  return new NoteService(store, logger);
}

describe('Route Handlers', () => {
  describe('handleGetNotes', () => {
    it('returns empty array when no notes exist', async () => {
      const service = createService();
      const result = await handleGetNotes(service);
      expect(result.status).toBe(200);
      expect(result.body).toEqual([]);
    });

    it('returns all notes', async () => {
      const service = createService();
      await service.create({ title: 'Note 1', content: 'Content 1' });
      await service.create({ title: 'Note 2', content: 'Content 2' });

      const result = await handleGetNotes(service);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      expect((result.body as any[]).length).toBe(2);
    });
  });

  describe('handleGetNote', () => {
    it('returns a note by id', async () => {
      const service = createService();
      const created = await service.create({ title: 'Test', content: 'Content' });

      const result = await handleGetNote(service, created.id);
      expect(result.status).toBe(200);
      expect((result.body as any).title).toBe('Test');
      expect((result.body as any).content).toBe('Content');
    });

    it('returns 404 for non-existent note', async () => {
      const service = createService();
      const result = await handleGetNote(service, 'nonexistent');
      expect(result.status).toBe(404);
      expect((result.body as any).error).toContain('not found');
    });
  });

  describe('handleCreateNote', () => {
    it('creates a note with valid input', async () => {
      const service = createService();
      const result = await handleCreateNote(service, {
        title: 'New Note',
        content: 'New Content',
      });
      expect(result.status).toBe(200);
      expect((result.body as any).title).toBe('New Note');
      expect((result.body as any).content).toBe('New Content');
      expect((result.body as any).id).toBeDefined();
      expect((result.body as any).createdAt).toBeDefined();
      expect((result.body as any).updatedAt).toBeDefined();
    });

    it('returns 400 for empty title', async () => {
      const service = createService();
      const result = await handleCreateNote(service, { title: '', content: 'Content' });
      expect(result.status).toBe(400);
      expect((result.body as any).error).toContain('Validation failed');
    });

    it('returns 400 for empty content', async () => {
      const service = createService();
      const result = await handleCreateNote(service, { title: 'Title', content: '' });
      expect(result.status).toBe(400);
      expect((result.body as any).error).toContain('Validation failed');
    });

    it('returns 400 for title exceeding max length', async () => {
      const service = createService();
      const result = await handleCreateNote(service, {
        title: 'x'.repeat(201),
        content: 'Content',
      });
      expect(result.status).toBe(400);
      expect((result.body as any).error).toContain('200 characters');
    });

    it('returns 400 for content exceeding max length', async () => {
      const service = createService();
      const result = await handleCreateNote(service, {
        title: 'Title',
        content: 'x'.repeat(10001),
      });
      expect(result.status).toBe(400);
      expect((result.body as any).error).toContain('10,000 characters');
    });
  });

  describe('handleUpdateNote', () => {
    it('updates an existing note title', async () => {
      const service = createService();
      const created = await service.create({ title: 'Original', content: 'Content' });

      const result = await handleUpdateNote(service, created.id, { title: 'Updated' });
      expect(result.status).toBe(200);
      expect((result.body as any).title).toBe('Updated');
      expect((result.body as any).content).toBe('Content');
    });

    it('updates an existing note content', async () => {
      const service = createService();
      const created = await service.create({ title: 'Title', content: 'Original' });

      const result = await handleUpdateNote(service, created.id, { content: 'Updated Content' });
      expect(result.status).toBe(200);
      expect((result.body as any).title).toBe('Title');
      expect((result.body as any).content).toBe('Updated Content');
    });

    it('updates both title and content', async () => {
      const service = createService();
      const created = await service.create({ title: 'Old Title', content: 'Old Content' });

      const result = await handleUpdateNote(service, created.id, {
        title: 'New Title',
        content: 'New Content',
      });
      expect(result.status).toBe(200);
      expect((result.body as any).title).toBe('New Title');
      expect((result.body as any).content).toBe('New Content');
    });

    it('returns 404 for non-existent note', async () => {
      const service = createService();
      const result = await handleUpdateNote(service, 'nonexistent', { title: 'Updated' });
      expect(result.status).toBe(404);
      expect((result.body as any).error).toContain('not found');
    });

    it('returns 400 for validation error (empty title)', async () => {
      const service = createService();
      const created = await service.create({ title: 'Title', content: 'Content' });

      const result = await handleUpdateNote(service, created.id, { title: '   ' });
      expect(result.status).toBe(400);
      expect((result.body as any).error).toContain('Validation failed');
    });

    it('returns 400 when no fields provided', async () => {
      const service = createService();
      const created = await service.create({ title: 'Title', content: 'Content' });

      const result = await handleUpdateNote(service, created.id, {});
      expect(result.status).toBe(400);
      expect((result.body as any).error).toContain('At least one field');
    });

    it('preserves updatedAt timestamp change', async () => {
      const service = createService();
      const created = await service.create({ title: 'Title', content: 'Content' });

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await handleUpdateNote(service, created.id, { title: 'Updated' });
      expect(result.status).toBe(200);
      expect((result.body as any).updatedAt).not.toBe(created.updatedAt);
    });
  });

  describe('handleDeleteNote', () => {
    it('deletes an existing note', async () => {
      const service = createService();
      const created = await service.create({ title: 'To Delete', content: 'Content' });

      const result = await handleDeleteNote(service, created.id);
      expect(result.status).toBe(200);
      expect((result.body as any).success).toBe(true);

      // Verify it's actually gone
      const getResult = await handleGetNote(service, created.id);
      expect(getResult.status).toBe(404);
    });

    it('returns 404 for non-existent note', async () => {
      const service = createService();
      const result = await handleDeleteNote(service, 'nonexistent');
      expect(result.status).toBe(404);
      expect((result.body as any).error).toContain('not found');
    });

    it('returns 404 when deleting same note twice', async () => {
      const service = createService();
      const created = await service.create({ title: 'Double Delete', content: 'Content' });

      const first = await handleDeleteNote(service, created.id);
      expect(first.status).toBe(200);

      const second = await handleDeleteNote(service, created.id);
      expect(second.status).toBe(404);
    });
  });
});
