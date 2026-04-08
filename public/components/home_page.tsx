/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiButton,
  EuiButtonEmpty,
  EuiBasicTable,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiTextArea,
  EuiFormRow,
  EuiEmptyPrompt,
  EuiConfirmModal,
  EuiPanel,
  EuiTitle,
} from '@opensearch-project/oui';
import { Note } from '../../core/types';
import { ApiClient, OsdHttpClient, OsdNotifications } from '../services/api_client';

// OSD best practice: all user-facing strings should use i18n for localization.
// In a full OSD environment, import from '@osd/i18n':
//   import { i18n } from '@osd/i18n';
//   const title = i18n.translate('myPlugin.notes.title', { defaultMessage: 'Notes' });
//
// For this template, strings are hardcoded for simplicity. When adapting for
// an opensearch-project repo, wrap every user-facing string with i18n.translate().

interface HomePageProps {
  http: OsdHttpClient | null;
  notifications: OsdNotifications | null;
}

export const HomePage: React.FC<HomePageProps> = ({ http, notifications }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);

  // Memoize ApiClient so it's not recreated on every render.
  const client = useMemo(() => new ApiClient(http), [http]);

  // Use OSD notifications.toasts when available (plugin mode), fall back to
  // console for standalone mode. The OSD toast API provides stacked, dismissible,
  // accessible notifications in the global toast container.
  const showToast = useCallback(
    (message: string, type: 'success' | 'danger' = 'success') => {
      if (notifications?.toasts) {
        if (type === 'success') {
          notifications.toasts.addSuccess(message);
        } else {
          notifications.toasts.addDanger(message);
        }
      } else {
        // Standalone fallback — no OSD toast service available
        if (type === 'danger') {
          console.error(`[Toast] ${message}`);
        } else {
          console.log(`[Toast] ${message}`);
        }
      }
    },
    [notifications]
  );

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.getNotes();
      setNotes(data);
    } catch (err) {
      showToast('Failed to load notes', 'danger');
    } finally {
      setLoading(false);
    }
  }, [client, showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async () => {
    try {
      if (editingNote) {
        await client.updateNote(editingNote.id, { title, content });
        showToast('Note updated');
      } else {
        await client.createNote({ title, content });
        showToast('Note created');
      }
      resetForm();
      fetchNotes();
    } catch (err) {
      showToast('Failed to save note', 'danger');
    }
  };

  const handleDelete = async () => {
    if (!deleteNote) return;
    try {
      await client.deleteNote(deleteNote.id);
      showToast('Note deleted');
      setDeleteNote(null);
      fetchNotes();
    } catch (err) {
      showToast('Failed to delete note', 'danger');
    }
  };

  const startEdit = useCallback((note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setShowForm(true);
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  // Memoize columns to avoid recreating on every render.
  const columns = useMemo(
    () => [
      { field: 'title', name: 'Title', truncateText: true },
      {
        field: 'content',
        name: 'Content',
        truncateText: true,
        render: (val: string) => (val.length > 80 ? val.substring(0, 80) + '...' : val),
      },
      {
        field: 'updatedAt',
        name: 'Updated',
        render: (val: string) => new Date(val).toLocaleString(),
      },
      {
        name: 'Actions',
        actions: [
          {
            name: 'Edit',
            description: 'Edit this note',
            icon: 'pencil',
            type: 'icon' as const,
            onClick: (note: Note) => startEdit(note),
          },
          {
            name: 'Delete',
            description: 'Delete this note',
            icon: 'trash',
            type: 'icon' as const,
            color: 'danger' as const,
            onClick: (note: Note) => setDeleteNote(note),
          },
        ],
      },
    ],
    [startEdit]
  );

  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <EuiPageHeader
          pageTitle="Notes"
          description="Create and manage your notes."
          rightSideItems={[
            <EuiButton
              fill
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              data-test-subj="createNoteButton"
            >
              Create Note
            </EuiButton>,
          ]}
        />

        <EuiSpacer />

        {showForm && (
          <EuiPanel>
            <EuiTitle size="s">
              <h2>{editingNote ? 'Edit Note' : 'Create Note'}</h2>
            </EuiTitle>
            <EuiSpacer size="m" />
            <EuiFormRow label="Title">
              <EuiFieldText
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                data-test-subj="noteTitleInput"
              />
            </EuiFormRow>
            <EuiFormRow label="Content">
              <EuiTextArea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setContent(e.target.value)
                }
                rows={4}
                data-test-subj="noteContentInput"
              />
            </EuiFormRow>
            <EuiSpacer size="m" />
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton
                  fill
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim()}
                  data-test-subj="saveNoteButton"
                >
                  {editingNote ? 'Update' : 'Save'}
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty onClick={resetForm} data-test-subj="cancelNoteButton">
                  Cancel
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        )}

        <EuiSpacer />

        {!loading && notes.length === 0 ? (
          <EuiEmptyPrompt
            iconType="document"
            title={<h2>No notes yet</h2>}
            body={<p>Create your first note to get started.</p>}
            actions={
              <EuiButton
                fill
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                data-test-subj="emptyCreateNoteButton"
              >
                Create Note
              </EuiButton>
            }
          />
        ) : (
          <EuiBasicTable
            items={notes}
            itemId="id"
            columns={columns}
            loading={loading}
            data-test-subj="notesTable"
          />
        )}

        {deleteNote && (
          <EuiConfirmModal
            title="Delete note?"
            onCancel={() => setDeleteNote(null)}
            onConfirm={handleDelete}
            cancelButtonText="Cancel"
            confirmButtonText="Delete"
            buttonColor="danger"
            defaultFocusedButton="cancel"
            data-test-subj="deleteConfirmModal"
          >
            <p>Are you sure you want to delete &quot;{deleteNote.title}&quot;?</p>
          </EuiConfirmModal>
        )}
      </EuiPageBody>
    </EuiPage>
  );
};
