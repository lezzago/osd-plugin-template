/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomePage } from '../home_page';
import { ApiClient } from '../../services/api_client';
import { Note } from '../../../core/types';

// Mock the ApiClient module
jest.mock('../../services/api_client');

const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'First Note',
    content: 'This is the content of the first note.',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'note-2',
    title: 'Second Note',
    content: 'This is the content of the second note.',
    createdAt: '2024-01-16T12:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
  },
];

const mockHttp = {
  basePath: { get: () => '/app' },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
const mockNotifications = {
  toasts: {
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
    addWarning: jest.fn(),
  },
};

let mockGetNotes: jest.Mock;
let mockCreateNote: jest.Mock;
let mockUpdateNote: jest.Mock;
let mockDeleteNote: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  mockGetNotes = jest.fn().mockResolvedValue(mockNotes);
  mockCreateNote = jest.fn().mockResolvedValue({
    id: 'note-3',
    title: 'New Note',
    content: 'New content',
    createdAt: '2024-01-17T08:00:00Z',
    updatedAt: '2024-01-17T08:00:00Z',
  });
  mockUpdateNote = jest.fn().mockResolvedValue({
    ...mockNotes[0],
    title: 'Updated Title',
    updatedAt: '2024-01-17T09:00:00Z',
  });
  mockDeleteNote = jest.fn().mockResolvedValue(undefined);

  (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(
    () =>
      ({
        getNotes: mockGetNotes,
        getNote: jest.fn(),
        createNote: mockCreateNote,
        updateNote: mockUpdateNote,
        deleteNote: mockDeleteNote,
      }) as unknown as ApiClient
  );
});

// Helper: OSD uses data-test-subj instead of data-testid
function getBySubj(subj: string): HTMLElement {
  const el = document.querySelector(`[data-test-subj="${subj}"]`);
  if (!el) throw new Error(`Element with data-test-subj="${subj}" not found`);
  return el as HTMLElement;
}

function queryBySubj(subj: string): HTMLElement | null {
  return document.querySelector(`[data-test-subj="${subj}"]`) as HTMLElement | null;
}

describe('HomePage', () => {
  it('renders loading state initially', () => {
    // Make getNotes hang so loading stays true
    mockGetNotes.mockReturnValue(new Promise(() => {}));
    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    const table = getBySubj('notesTable');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('data-loading', 'true');
  });

  it('renders notes in table after loading', async () => {
    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    expect(screen.getByText('Second Note')).toBeInTheDocument();
    expect(mockGetNotes).toHaveBeenCalledTimes(1);
  });

  it('shows empty prompt when no notes', async () => {
    mockGetNotes.mockResolvedValue([]);

    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first note to get started.')).toBeInTheDocument();
  });

  it('opens create form when button clicked', async () => {
    mockGetNotes.mockResolvedValue([]);

    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    fireEvent.click(getBySubj('createNoteButton'));

    expect(screen.getByText('Create Note', { selector: 'h2' })).toBeInTheDocument();
    expect(getBySubj('noteTitleInput')).toBeInTheDocument();
    expect(getBySubj('noteContentInput')).toBeInTheDocument();
    expect(getBySubj('saveNoteButton')).toBeInTheDocument();
    expect(getBySubj('cancelNoteButton')).toBeInTheDocument();
  });

  it('can create a note via form submission', async () => {
    mockGetNotes.mockResolvedValue([]);

    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    await waitFor(() => {
      expect(getBySubj('createNoteButton')).toBeInTheDocument();
    });

    fireEvent.click(getBySubj('createNoteButton'));

    const saveButton = getBySubj('saveNoteButton');
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalled();
    });
  });

  it('hides form when cancel is clicked', async () => {
    mockGetNotes.mockResolvedValue([]);

    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    await waitFor(() => {
      expect(getBySubj('createNoteButton')).toBeInTheDocument();
    });

    // Open form
    fireEvent.click(getBySubj('createNoteButton'));
    expect(screen.getByText('Create Note', { selector: 'h2' })).toBeInTheDocument();

    // Cancel
    fireEvent.click(getBySubj('cancelNoteButton'));

    // Form heading should be gone
    expect(screen.queryByText('Create Note', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('shows error toast when fetch fails', async () => {
    mockGetNotes.mockRejectedValue(new Error('Network error'));

    render(<HomePage http={mockHttp} notifications={mockNotifications} />);

    // Toasts now use the OSD notifications API instead of inline rendering
    await waitFor(() => {
      expect(mockNotifications.toasts.addDanger).toHaveBeenCalledWith('Failed to load notes');
    });
  });
});
