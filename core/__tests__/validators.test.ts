/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateCreateNote, validateUpdateNote } from '../validators';

describe('validateCreateNote', () => {
  it('returns empty array for valid input', () => {
    const errors = validateCreateNote({ title: 'Valid Title', content: 'Valid content' });
    expect(errors).toEqual([]);
  });

  it('accepts title at max length (200 chars)', () => {
    const errors = validateCreateNote({ title: 'a'.repeat(200), content: 'Valid content' });
    expect(errors).toEqual([]);
  });

  it('accepts content at max length (10000 chars)', () => {
    const errors = validateCreateNote({ title: 'Valid Title', content: 'a'.repeat(10000) });
    expect(errors).toEqual([]);
  });

  describe('title validation', () => {
    it('rejects empty title', () => {
      const errors = validateCreateNote({ title: '', content: 'Content' });
      expect(errors).toContain('Title is required');
    });

    it('rejects whitespace-only title', () => {
      const errors = validateCreateNote({ title: '   ', content: 'Content' });
      expect(errors).toContain('Title is required');
    });

    it('rejects title exceeding 200 characters', () => {
      const errors = validateCreateNote({ title: 'a'.repeat(201), content: 'Content' });
      expect(errors).toContain('Title must be 200 characters or less');
    });
  });

  describe('content validation', () => {
    it('rejects empty content', () => {
      const errors = validateCreateNote({ title: 'Title', content: '' });
      expect(errors).toContain('Content is required');
    });

    it('rejects whitespace-only content', () => {
      const errors = validateCreateNote({ title: 'Title', content: '   ' });
      expect(errors).toContain('Content is required');
    });

    it('rejects content exceeding 10000 characters', () => {
      const errors = validateCreateNote({ title: 'Title', content: 'a'.repeat(10001) });
      expect(errors).toContain('Content must be 10,000 characters or less');
    });
  });

  it('returns multiple errors when both fields are invalid', () => {
    const errors = validateCreateNote({ title: '', content: '' });
    expect(errors).toHaveLength(2);
    expect(errors).toContain('Title is required');
    expect(errors).toContain('Content is required');
  });
});

describe('validateUpdateNote', () => {
  it('returns empty array for valid title-only update', () => {
    const errors = validateUpdateNote({ title: 'New Title' });
    expect(errors).toEqual([]);
  });

  it('returns empty array for valid content-only update', () => {
    const errors = validateUpdateNote({ content: 'New content' });
    expect(errors).toEqual([]);
  });

  it('returns empty array for valid title and content update', () => {
    const errors = validateUpdateNote({ title: 'New Title', content: 'New content' });
    expect(errors).toEqual([]);
  });

  it('accepts title at max length (200 chars)', () => {
    const errors = validateUpdateNote({ title: 'a'.repeat(200) });
    expect(errors).toEqual([]);
  });

  it('accepts content at max length (10000 chars)', () => {
    const errors = validateUpdateNote({ content: 'a'.repeat(10000) });
    expect(errors).toEqual([]);
  });

  describe('title validation', () => {
    it('rejects empty title', () => {
      const errors = validateUpdateNote({ title: '' });
      expect(errors).toContain('Title cannot be empty');
    });

    it('rejects whitespace-only title', () => {
      const errors = validateUpdateNote({ title: '   ' });
      expect(errors).toContain('Title cannot be empty');
    });

    it('rejects title exceeding 200 characters', () => {
      const errors = validateUpdateNote({ title: 'a'.repeat(201) });
      expect(errors).toContain('Title must be 200 characters or less');
    });
  });

  describe('content validation', () => {
    it('rejects empty content', () => {
      const errors = validateUpdateNote({ content: '' });
      expect(errors).toContain('Content cannot be empty');
    });

    it('rejects whitespace-only content', () => {
      const errors = validateUpdateNote({ content: '   ' });
      expect(errors).toContain('Content cannot be empty');
    });

    it('rejects content exceeding 10000 characters', () => {
      const errors = validateUpdateNote({ content: 'a'.repeat(10001) });
      expect(errors).toContain('Content must be 10,000 characters or less');
    });
  });

  it('rejects update with no fields provided', () => {
    const errors = validateUpdateNote({});
    expect(errors).toContain('At least one field (title or content) must be provided');
  });

  it('returns multiple errors when both fields are invalid', () => {
    const errors = validateUpdateNote({ title: '', content: '' });
    expect(errors).toHaveLength(2);
    expect(errors).toContain('Title cannot be empty');
    expect(errors).toContain('Content cannot be empty');
  });
});
