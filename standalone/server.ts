/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { InMemoryNoteStore } from '../core/note_store';
import { NoteService } from '../core/note_service';
import { MOCK_NOTES } from '../core/mock_data';
import {
  handleGetNotes,
  handleGetNote,
  handleCreateNote,
  handleUpdateNote,
  handleDeleteNote,
} from '../server/routes/handlers';
import { Logger } from '../core/types';

const PORT = process.env.PORT || 3000;
const MOCK_MODE = process.env.MOCK_MODE === 'true';

const logger: Logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => {
    if (process.env.DEBUG) console.log(`[DEBUG] ${msg}`);
  },
};

const store = new InMemoryNoteStore();
if (MOCK_MODE) {
  store.seed(MOCK_NOTES);
  logger.info(`MOCK_MODE: Seeded ${MOCK_NOTES.length} notes`);
}

const noteService = new NoteService(store, logger);
const app = express();

app.use(express.json());

// Serve static client bundle
app.use(express.static(path.join(__dirname, 'client')));

// API routes — reuse the same framework-agnostic handlers
app.get('/api/notes', async (_req, res) => {
  const result = await handleGetNotes(noteService);
  res.status(result.status).json(result.body);
});

app.get('/api/notes/:id', async (req, res) => {
  const result = await handleGetNote(noteService, req.params.id);
  res.status(result.status).json(result.body);
});

app.post('/api/notes', async (req, res) => {
  const result = await handleCreateNote(noteService, req.body);
  res.status(result.status).json(result.body);
});

app.put('/api/notes/:id', async (req, res) => {
  const result = await handleUpdateNote(noteService, req.params.id, req.body);
  res.status(result.status).json(result.body);
});

app.delete('/api/notes/:id', async (req, res) => {
  const result = await handleDeleteNote(noteService, req.params.id);
  res.status(result.status).json(result.body);
});

// Serve index.html for all other routes (SPA)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
  logger.info(`Standalone server running on http://localhost:${PORT}`);
  logger.info(`MOCK_MODE: ${MOCK_MODE}`);
});
