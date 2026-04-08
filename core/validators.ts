/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateNoteInput, UpdateNoteInput } from './types';

export function validateCreateNote(input: CreateNoteInput): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (input.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!input.content || input.content.trim().length === 0) {
    errors.push('Content is required');
  } else if (input.content.length > 10000) {
    errors.push('Content must be 10,000 characters or less');
  }

  return errors;
}

export function validateUpdateNote(input: UpdateNoteInput): string[] {
  const errors: string[] = [];

  if (input.title !== undefined) {
    if (input.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (input.title.length > 200) {
      errors.push('Title must be 200 characters or less');
    }
  }

  if (input.content !== undefined) {
    if (input.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else if (input.content.length > 10000) {
      errors.push('Content must be 10,000 characters or less');
    }
  }

  if (input.title === undefined && input.content === undefined) {
    errors.push('At least one field (title or content) must be provided');
  }

  return errors;
}
