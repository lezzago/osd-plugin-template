/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { App } from './components/app';

export function renderApp(
  core: CoreStart,
  deps: AppPluginStartDependencies,
  { element, appBasePath }: AppMountParameters
) {
  ReactDOM.render(<App http={core.http} notifications={core.notifications} basename={appBasePath} />, element);
  return () => ReactDOM.unmountComponentAtNode(element);
}
