/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note, CreateNoteInput, UpdateNoteInput, INoteStore, Logger } from './types';
import { validateCreateNote, validateUpdateNote } from './validators';

export class NoteService {
  constructor(
    private readonly store: INoteStore,
    private readonly logger: Logger
  ) {}

  async getAll(): Promise<Note[]> {
    this.logger.debug('Fetching all notes');
    return this.store.getAll();
  }

  async getById(id: string): Promise<Note | null> {
    this.logger.debug(`Fetching note ${id}`);
    return this.store.getById(id);
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const errors = validateCreateNote(input);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    this.logger.info(`Creating note: ${input.title}`);
    return this.store.create(input);
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const errors = validateUpdateNote(input);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    this.logger.info(`Updating note ${id}`);
    return this.store.update(id, input);
  }

  async delete(id: string): Promise<boolean> {
    this.logger.info(`Deleting note ${id}`);
    return this.store.delete(id);
  }
}
