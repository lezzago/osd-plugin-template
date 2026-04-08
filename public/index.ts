/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';
import { MyPluginPlugin } from './plugin';

export function plugin() {
  return new MyPluginPlugin();
}
export { MyPluginSetup, MyPluginStart } from './types';
