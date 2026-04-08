/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter, Logger } from '../../../../src/core/server';
import { schema } from '@osd/config-schema';
import {
  handleGetNotes,
  handleGetNote,
  handleCreateNote,
  handleUpdateNote,
  handleDeleteNote,
} from './handlers';
import { SavedObjectNoteStore } from '../note_saved_object_store';
import { NoteService } from '../../core/note_service';

/**
 * Define all plugin routes.
 *
 * Each route handler creates a NoteService from the request-scoped saved objects
 * client. This ensures proper per-user and per-workspace data isolation — the
 * OSD pattern for all CRUD operations.
 */
export function defineRoutes(router: IRouter, logger: Logger) {
  // Helper: create a request-scoped NoteService from the handler context.
  // The saved objects client from context.core is scoped to the current user
  // and workspace — this is the correct OSD pattern.
  function createNoteService(context: any): NoteService {
    const client = context.core.savedObjects.client;
    const store = new SavedObjectNoteStore(client);
    return new NoteService(store, logger);
  }

  // GET /api/my_plugin/notes
  router.get(
    {
      path: '/api/my_plugin/notes',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const service = createNoteService(context);
        const result = await handleGetNotes(service);
        return response.ok({ body: result.body });
      } catch (err) {
        logger.error(`GET /notes failed: ${err}`);
        return response.customError({ statusCode: 500, body: { message: String(err) } });
      }
    }
  );

  // GET /api/my_plugin/notes/{id}
  router.get(
    {
      path: '/api/my_plugin/notes/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const service = createNoteService(context);
        const result = await handleGetNote(service, request.params.id);
        if (result.status === 404) {
          return response.notFound({ body: result.body });
        }
        return response.ok({ body: result.body });
      } catch (err) {
        logger.error(`GET /notes/${request.params.id} failed: ${err}`);
        return response.customError({ statusCode: 500, body: { message: String(err) } });
      }
    }
  );

  // POST /api/my_plugin/notes
  router.post(
    {
      path: '/api/my_plugin/notes',
      validate: {
        body: schema.object({
          title: schema.string(),
          content: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const service = createNoteService(context);
        const result = await handleCreateNote(service, request.body);
        if (result.status === 400) {
          return response.badRequest({ body: result.body });
        }
        return response.ok({ body: result.body });
      } catch (err) {
        logger.error(`POST /notes failed: ${err}`);
        return response.customError({ statusCode: 500, body: { message: String(err) } });
      }
    }
  );

  // PUT /api/my_plugin/notes/{id}
  router.put(
    {
      path: '/api/my_plugin/notes/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          title: schema.maybe(schema.string()),
          content: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const service = createNoteService(context);
        const result = await handleUpdateNote(service, request.params.id, request.body);
        if (result.status === 404) {
          return response.notFound({ body: result.body });
        }
        if (result.status === 400) {
          return response.badRequest({ body: result.body });
        }
        return response.ok({ body: result.body });
      } catch (err) {
        logger.error(`PUT /notes/${request.params.id} failed: ${err}`);
        return response.customError({ statusCode: 500, body: { message: String(err) } });
      }
    }
  );

  // DELETE /api/my_plugin/notes/{id}
  router.delete(
    {
      path: '/api/my_plugin/notes/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const service = createNoteService(context);
        const result = await handleDeleteNote(service, request.params.id);
        if (result.status === 404) {
          return response.notFound({ body: result.body });
        }
        return response.ok({ body: result.body });
      } catch (err) {
        logger.error(`DELETE /notes/${request.params.id} failed: ${err}`);
        return response.customError({ statusCode: 500, body: { message: String(err) } });
      }
    }
  );
}
