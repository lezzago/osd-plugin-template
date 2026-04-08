/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin, DEFAULT_NAV_GROUPS } from '../../../src/core/public';
import { MyPluginSetup, MyPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { renderApp } from './application';

export class MyPluginPlugin implements Plugin<MyPluginSetup, MyPluginStart> {
  public setup(core: CoreSetup): MyPluginSetup {
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      // OSD best practice: use i18n for user-facing text in app registration.
      // In a full OSD environment, import { i18n } from '@osd/i18n' and use:
      //   title: i18n.translate('myPlugin.appTitle', { defaultMessage: 'My Plugin' }),
      async mount(params: any) {
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Register in nav group if available
    try {
      if (core.chrome?.navGroup?.getNavGroupEnabled()) {
        core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
          {
            id: PLUGIN_ID,
            category: undefined,
            order: 300,
          },
        ]);
      }
    } catch {
      // Nav groups not available — OK
    }

    return {};
  }

  public start(_core: CoreStart): MyPluginStart {
    return {};
  }

  public stop() {}
}
