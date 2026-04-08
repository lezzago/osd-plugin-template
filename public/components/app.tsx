/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { HomePage } from './home_page';
import { OsdHttpClient, OsdNotifications } from '../services/api_client';

interface AppProps {
  http: OsdHttpClient | null;
  notifications: OsdNotifications | null;
  basename: string;
}

export const App: React.FC<AppProps> = ({ http, notifications, basename }) => {
  return (
    <Router basename={basename}>
      <Switch>
        <Route exact path="/">
          <HomePage http={http} notifications={notifications} />
        </Route>
      </Switch>
    </Router>
  );
};
