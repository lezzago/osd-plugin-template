/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';
import { MyPluginSetup, MyPluginStart } from './types';
import { defineRoutes } from './routes';

export class MyPlugin implements Plugin<MyPluginSetup, MyPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.info('Setting up MyPlugin');

    const router = core.http.createRouter();

    // Register saved object type for notes.
    // The `migrations` field handles schema evolution across plugin versions.
    core.savedObjects.registerType({
      name: 'note',
      hidden: false,
      namespaceType: 'single',
      mappings: {
        properties: {
          title: { type: 'text' },
          content: { type: 'text' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
      migrations: {
        // Example: if you add a field in v2, add a migration here:
        // '2.0.0': (doc) => ({ ...doc, attributes: { ...doc.attributes, newField: '' } }),
      },
    });

    // Define routes. Route handlers receive the request context, which provides
    // access to the saved objects client scoped to the current user and workspace.
    // This is the correct OSD pattern — never use createInternalRepository() for
    // user-facing operations.
    defineRoutes(router, this.logger);

    return {};
  }

  public start(_core: CoreStart) {
    this.logger.info('Starting MyPlugin');
    return {};
  }

  public stop() {}
}
