/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../src/core/server';
import { MyPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new MyPlugin(initializerContext);
}

export { MyPluginSetup, MyPluginStart } from './types';
