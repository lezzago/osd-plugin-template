/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../src/core/server';
import { Note, CreateNoteInput, UpdateNoteInput, INoteStore } from '../core/types';

export class SavedObjectNoteStore implements INoteStore {
  constructor(private readonly client: SavedObjectsClientContract) {}

  async getAll(): Promise<Note[]> {
    const result = await this.client.find({
      type: 'note',
      perPage: 1000,
      sortField: 'updatedAt',
      sortOrder: 'desc',
    });
    return result.saved_objects.map(this.toNote);
  }

  async getById(id: string): Promise<Note | null> {
    try {
      const obj = await this.client.get('note', id);
      return this.toNote(obj);
    } catch {
      return null;
    }
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const now = new Date().toISOString();
    const obj = await this.client.create('note', {
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    });
    return this.toNote(obj);
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const attributes: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.title !== undefined) attributes.title = input.title;
    if (input.content !== undefined) attributes.content = input.content;

    // Delete and recreate with same ID (SavedObjects doesn't have a direct update)
    await this.client.delete('note', id);
    const obj = await this.client.create(
      'note',
      {
        title: input.title !== undefined ? input.title : existing.title,
        content: input.content !== undefined ? input.content : existing.content,
        createdAt: existing.createdAt,
        updatedAt: attributes.updatedAt,
      },
      { id }
    );
    return this.toNote(obj);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.delete('note', id);
      return true;
    } catch {
      return false;
    }
  }

  private toNote(obj: any): Note {
    return {
      id: obj.id,
      title: obj.attributes?.title ?? '',
      content: obj.attributes?.content ?? '',
      createdAt: obj.attributes?.createdAt ?? '',
      updatedAt: obj.attributes?.updatedAt ?? '',
    };
  }
}
