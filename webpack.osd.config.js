/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

/**
 * Webpack config for building the OSD plugin client bundle.
 *
 * The output is wrapped in __osdBundles__.define("plugin/myPlugin/public", ...)
 * so that OSD can load it as a plugin bundle at runtime.
 *
 * Mode is 'none' — OSD handles minification and optimization itself.
 */

// OSD shared dependencies — these are provided by the OSD runtime
// and must NOT be bundled into the plugin.
const OSD_EXTERNALS = {
  react: '__osdSharedDeps__.React',
  'react-dom': '__osdSharedDeps__.ReactDom',
  'react-dom/server': '__osdSharedDeps__.ReactDomServer',
  'react-router': '__osdSharedDeps__.ReactRouter',
  'react-router-dom': '__osdSharedDeps__.ReactRouterDom',
  '@elastic/eui': '__osdSharedDeps__.ElasticEui',
  '@opensearch-project/oui': '__osdSharedDeps__.OsdUi',
  '@elastic/eui/dist/eui_theme_light.css': '__osdSharedDeps__.ElasticEuiLightTheme',
  '@elastic/eui/lib/services/format': '__osdSharedDeps__.ElasticEuiLibServicesFormat',
  '@osd/i18n': '__osdSharedDeps__.OsdI18n',
  moment: '__osdSharedDeps__.Moment',
  lodash: '__osdSharedDeps__.Lodash',
};

module.exports = {
  mode: 'none',
  entry: './public/index.ts',
  output: {
    filename: 'myPlugin.plugin.js',
    path: path.resolve(__dirname, 'build', 'public'),
    library: {
      name: '__myPlugin_exports__',
      type: 'var',
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Stub out OSD core imports for out-of-tree compilation
      '../../../src/core/public': path.resolve(__dirname, 'stubs/src/core/public'),
      '../../../../src/core/public': path.resolve(__dirname, 'stubs/src/core/public'),
      '../../../src/plugins/navigation/public': path.resolve(
        __dirname,
        'stubs/src/plugins/navigation/public'
      ),
      '../../../../src/plugins/navigation/public': path.resolve(
        __dirname,
        'stubs/src/plugins/navigation/public'
      ),
    },
  },
  externals: [
    function ({ request }, callback) {
      if (OSD_EXTERNALS[request]) {
        return callback(null, OSD_EXTERNALS[request]);
      }
      callback();
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.osd.json',
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    {
      // Wrap the bundle output in __osdBundles__.define(...)
      // This is how OSD discovers and loads plugin client code.
      apply(compiler) {
        compiler.hooks.compilation.tap('OsdBundleWrapper', (compilation) => {
          const { ConcatSource } = require('webpack-sources');
          compilation.hooks.processAssets.tap(
            {
              name: 'OsdBundleWrapper',
              stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE,
            },
            (assets) => {
              for (const [name, source] of Object.entries(assets)) {
                if (name.endsWith('.js')) {
                  const wrapped = new ConcatSource(
                    '__osdBundles__.define("plugin/myPlugin/public", function(__osdBundles__require__, __osdBundles__module__, __osdBundles__exports__) {\n',
                    source,
                    '\nObject.defineProperty(__osdBundles__exports__, "__esModule", { value: true });\n',
                    'Object.keys(__myPlugin_exports__).forEach(function(key) {\n',
                    '  __osdBundles__exports__[key] = __myPlugin_exports__[key];\n',
                    '});\n',
                    '});\n'
                  );
                  compilation.updateAsset(name, wrapped);
                }
              }
            }
          );
        });
      },
    },
  ],
};
