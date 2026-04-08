/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { App } from '../public/components/app';

// In standalone mode, http is null — ApiClient falls back to fetch()
ReactDOM.render(
  <App http={null} notifications={null} basename="" />,
  document.getElementById('root')
);
