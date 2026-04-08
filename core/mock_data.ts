/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note } from './types';

export const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Welcome to My Plugin',
    content: 'This is a sample note created by the template. Edit or delete it to get started!',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Architecture Overview',
    content:
      'This plugin uses a dual-mode architecture: it runs both as an OSD plugin and a standalone Express app. The core/ directory contains framework-agnostic business logic shared by both modes.',
    createdAt: '2024-01-15T11:00:00.000Z',
    updatedAt: '2024-01-15T11:00:00.000Z',
  },
  {
    id: '3',
    title: 'Development Tips',
    content:
      'Use standalone mode for rapid iteration (npm run start:standalone). Use OSD mode for testing saved objects and navigation integration. See CLAUDE.md for the full development guide.',
    createdAt: '2024-01-15T12:00:00.000Z',
    updatedAt: '2024-01-15T12:00:00.000Z',
  },
];
