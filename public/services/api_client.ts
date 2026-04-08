/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note, CreateNoteInput, UpdateNoteInput } from '../../core/types';

/**
 * Minimal interface for the OSD HTTP client.
 * In a full OSD environment this is HttpStart from src/core/public.
 * Defined here so the template compiles without the full OSD type tree.
 */
export interface OsdHttpClient {
  basePath?: { get(): string };
  get<T = unknown>(path: string, options?: Record<string, unknown>): Promise<T>;
  post<T = unknown>(path: string, options?: Record<string, unknown>): Promise<T>;
  put<T = unknown>(path: string, options?: Record<string, unknown>): Promise<T>;
  delete<T = unknown>(path: string, options?: Record<string, unknown>): Promise<T>;
}

/**
 * Minimal interface for the OSD notifications service.
 * In a full OSD environment this is NotificationsStart from src/core/public.
 */
export interface OsdNotifications {
  toasts: {
    addSuccess(message: string): void;
    addDanger(message: string): void;
    addWarning(message: string): void;
  };
}

interface ApiPaths {
  notes: string;
  note: (id: string) => string;
}

const OSD_PATHS: ApiPaths = {
  notes: '/api/my_plugin/notes',
  note: (id: string) => `/api/my_plugin/notes/${id}`,
};

const STANDALONE_PATHS: ApiPaths = {
  notes: '/api/notes',
  note: (id: string) => `/api/notes/${id}`,
};

export class ApiClient {
  private readonly paths: ApiPaths;
  private readonly http: OsdHttpClient | null;

  constructor(http: OsdHttpClient | null) {
    this.http = http;
    // Detect mode: OSD provides http.basePath, standalone passes null.
    this.paths = http?.basePath ? OSD_PATHS : STANDALONE_PATHS;
  }

  async getNotes(): Promise<Note[]> {
    if (this.http) {
      return this.http.get<Note[]>(this.paths.notes);
    }
    return this.fetchJson<Note[]>(this.paths.notes);
  }

  async getNote(id: string): Promise<Note> {
    if (this.http) {
      return this.http.get<Note>(this.paths.note(id));
    }
    return this.fetchJson<Note>(this.paths.note(id));
  }

  async createNote(input: CreateNoteInput): Promise<Note> {
    if (this.http) {
      return this.http.post<Note>(this.paths.notes, { body: JSON.stringify(input) });
    }
    return this.fetchJson<Note>(this.paths.notes, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  async updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
    if (this.http) {
      return this.http.put<Note>(this.paths.note(id), { body: JSON.stringify(input) });
    }
    return this.fetchJson<Note>(this.paths.note(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (this.http) {
      await this.http.delete(this.paths.note(id));
      return;
    }
    const res = await fetch(this.paths.note(id), { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
    }
  }

  /**
   * Standalone fetch with proper error handling.
   * OSD's http client throws on non-2xx responses automatically;
   * browser fetch() does not, so we check res.ok explicitly.
   */
  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${init?.method || 'GET'} ${url} failed: ${res.status} ${body}`);
    }
    return res.json();
  }
}
