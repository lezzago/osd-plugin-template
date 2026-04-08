/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note, CreateNoteInput, UpdateNoteInput, INoteStore } from './types';

export class InMemoryNoteStore implements INoteStore {
  private notes: Map<string, Note> = new Map();
  private nextId = 1;

  async getAll(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getById(id: string): Promise<Note | null> {
    return this.notes.get(id) || null;
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: String(this.nextId++),
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(note.id, note);
    return note;
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const existing = this.notes.get(id);
    if (!existing) return null;

    const updated: Note = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  /** Seed initial data (used by MOCK_MODE) */
  seed(notes: Note[]): void {
    for (const note of notes) {
      this.notes.set(note.id, note);
      const numId = parseInt(note.id, 10);
      if (!isNaN(numId) && numId >= this.nextId) {
        this.nextId = numId + 1;
      }
    }
  }
}
