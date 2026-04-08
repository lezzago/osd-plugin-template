/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteService } from '../note_service';
import { InMemoryNoteStore } from '../note_store';
import { Logger, Note } from '../types';

function createMockLogger(): Logger & {
  calls: { info: string[]; warn: string[]; error: string[]; debug: string[] };
} {
  const calls = { info: [] as string[], warn: [] as string[], error: [] as string[], debug: [] as string[] };
  return {
    calls,
    info: (msg: string) => calls.info.push(msg),
    warn: (msg: string) => calls.warn.push(msg),
    error: (msg: string) => calls.error.push(msg),
    debug: (msg: string) => calls.debug.push(msg),
  };
}

describe('NoteService', () => {
  let store: InMemoryNoteStore;
  let logger: ReturnType<typeof createMockLogger>;
  let service: NoteService;

  beforeEach(() => {
    store = new InMemoryNoteStore();
    logger = createMockLogger();
    service = new NoteService(store, logger);
  });

  describe('getAll', () => {
    it('returns empty array when no notes exist', async () => {
      const result = await service.getAll();
      expect(result).toEqual([]);
    });

    it('returns all notes sorted by updatedAt desc', async () => {
      const notes: Note[] = [
        {
          id: '1',
          title: 'Oldest',
          content: 'First note',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'Newest',
          content: 'Second note',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-03T00:00:00.000Z',
        },
        {
          id: '3',
          title: 'Middle',
          content: 'Third note',
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ];
      store.seed(notes);

      const result = await service.getAll();
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Newest');
      expect(result[1].title).toBe('Middle');
      expect(result[2].title).toBe('Oldest');
    });

    it('logs debug message', async () => {
      await service.getAll();
      expect(logger.calls.debug).toContain('Fetching all notes');
    });
  });

  describe('getById', () => {
    it('returns note when found', async () => {
      const created = await store.create({ title: 'Test', content: 'Content' });
      const result = await service.getById(created.id);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Test');
      expect(result!.content).toBe('Content');
    });

    it('returns null when not found', async () => {
      const result = await service.getById('nonexistent');
      expect(result).toBeNull();
    });

    it('logs debug message with id', async () => {
      await service.getById('42');
      expect(logger.calls.debug).toContain('Fetching note 42');
    });
  });

  describe('create', () => {
    it('creates a note with valid input', async () => {
      const result = await service.create({ title: 'New Note', content: 'Some content' });
      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Note');
      expect(result.content).toBe('Some content');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('persists the note in the store', async () => {
      const created = await service.create({ title: 'Persisted', content: 'Check store' });
      const fetched = await service.getById(created.id);
      expect(fetched).toEqual(created);
    });

    it('logs info message with title', async () => {
      await service.create({ title: 'Log Test', content: 'Content' });
      expect(logger.calls.info).toContain('Creating note: Log Test');
    });

    it('rejects empty title', async () => {
      await expect(service.create({ title: '', content: 'Content' })).rejects.toThrow(
        'Validation failed: Title is required'
      );
    });

    it('rejects whitespace-only title', async () => {
      await expect(service.create({ title: '   ', content: 'Content' })).rejects.toThrow(
        'Validation failed: Title is required'
      );
    });

    it('rejects title exceeding 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      await expect(service.create({ title: longTitle, content: 'Content' })).rejects.toThrow(
        'Validation failed: Title must be 200 characters or less'
      );
    });

    it('rejects empty content', async () => {
      await expect(service.create({ title: 'Title', content: '' })).rejects.toThrow(
        'Validation failed: Content is required'
      );
    });

    it('rejects whitespace-only content', async () => {
      await expect(service.create({ title: 'Title', content: '   ' })).rejects.toThrow(
        'Validation failed: Content is required'
      );
    });

    it('rejects content exceeding 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      await expect(service.create({ title: 'Title', content: longContent })).rejects.toThrow(
        'Validation failed: Content must be 10,000 characters or less'
      );
    });

    it('reports multiple validation errors', async () => {
      await expect(service.create({ title: '', content: '' })).rejects.toThrow(
        'Validation failed: Title is required, Content is required'
      );
    });
  });

  describe('update', () => {
    let existingId: string;

    beforeEach(async () => {
      const note = await store.create({ title: 'Original', content: 'Original content' });
      existingId = note.id;
    });

    it('updates title of existing note', async () => {
      const result = await service.update(existingId, { title: 'Updated Title' });
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Updated Title');
      expect(result!.content).toBe('Original content');
    });

    it('updates content of existing note', async () => {
      const result = await service.update(existingId, { content: 'Updated content' });
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Original');
      expect(result!.content).toBe('Updated content');
    });

    it('updates both title and content', async () => {
      const result = await service.update(existingId, {
        title: 'New Title',
        content: 'New content',
      });
      expect(result).not.toBeNull();
      expect(result!.title).toBe('New Title');
      expect(result!.content).toBe('New content');
    });

    it('updates the updatedAt timestamp', async () => {
      const before = await store.getById(existingId);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result = await service.update(existingId, { title: 'Timestamped' });
      expect(new Date(result!.updatedAt).getTime()).toBeGreaterThan(
        new Date(before!.updatedAt).getTime()
      );
    });

    it('returns null for non-existent note', async () => {
      const result = await service.update('nonexistent', { title: 'Nope' });
      expect(result).toBeNull();
    });

    it('logs info message with id', async () => {
      await service.update(existingId, { title: 'Logged' });
      expect(logger.calls.info).toContain(`Updating note ${existingId}`);
    });

    it('rejects empty title', async () => {
      await expect(service.update(existingId, { title: '' })).rejects.toThrow(
        'Validation failed: Title cannot be empty'
      );
    });

    it('rejects title exceeding 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      await expect(service.update(existingId, { title: longTitle })).rejects.toThrow(
        'Validation failed: Title must be 200 characters or less'
      );
    });

    it('rejects empty content', async () => {
      await expect(service.update(existingId, { content: '' })).rejects.toThrow(
        'Validation failed: Content cannot be empty'
      );
    });

    it('rejects content exceeding 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      await expect(service.update(existingId, { content: longContent })).rejects.toThrow(
        'Validation failed: Content must be 10,000 characters or less'
      );
    });

    it('rejects update with no fields', async () => {
      await expect(service.update(existingId, {})).rejects.toThrow(
        'Validation failed: At least one field (title or content) must be provided'
      );
    });
  });

  describe('delete', () => {
    it('returns true when deleting existing note', async () => {
      const note = await store.create({ title: 'To Delete', content: 'Bye' });
      const result = await service.delete(note.id);
      expect(result).toBe(true);
    });

    it('removes note from store after deletion', async () => {
      const note = await store.create({ title: 'To Delete', content: 'Bye' });
      await service.delete(note.id);
      const fetched = await service.getById(note.id);
      expect(fetched).toBeNull();
    });

    it('returns false for non-existent note', async () => {
      const result = await service.delete('nonexistent');
      expect(result).toBe(false);
    });

    it('logs info message with id', async () => {
      await service.delete('42');
      expect(logger.calls.info).toContain('Deleting note 42');
    });
  });
});
