/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteService } from '../../core/note_service';
import { CreateNoteInput, UpdateNoteInput } from '../../core/types';

interface HandlerResponse {
  status: number;
  body: unknown;
}

export async function handleGetNotes(service: NoteService): Promise<HandlerResponse> {
  const notes = await service.getAll();
  return { status: 200, body: notes };
}

export async function handleGetNote(service: NoteService, id: string): Promise<HandlerResponse> {
  const note = await service.getById(id);
  if (!note) {
    return { status: 404, body: { error: `Note ${id} not found` } };
  }
  return { status: 200, body: note };
}

export async function handleCreateNote(
  service: NoteService,
  input: CreateNoteInput
): Promise<HandlerResponse> {
  try {
    const note = await service.create(input);
    return { status: 200, body: note };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { status: 400, body: { error: message } };
  }
}

export async function handleUpdateNote(
  service: NoteService,
  id: string,
  input: UpdateNoteInput
): Promise<HandlerResponse> {
  try {
    const note = await service.update(id, input);
    if (!note) {
      return { status: 404, body: { error: `Note ${id} not found` } };
    }
    return { status: 200, body: note };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { status: 400, body: { error: message } };
  }
}

export async function handleDeleteNote(
  service: NoteService,
  id: string
): Promise<HandlerResponse> {
  const deleted = await service.delete(id);
  if (!deleted) {
    return { status: 404, body: { error: `Note ${id} not found` } };
  }
  return { status: 200, body: { success: true } };
}
