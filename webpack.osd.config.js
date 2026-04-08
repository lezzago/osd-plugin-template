/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const webpack = require('webpack');

/**
 * Webpack config for building the OSD plugin client bundle.
 *
 * The output is wrapped in __osdBundles__.define("plugin/myPlugin/public", ...)
 * so that OSD can load it as a plugin bundle at runtime.
 *
 * Mode is 'none' — production mode tree-shakes OSD shared dependency
 * references, breaking the plugin at runtime. OSD handles minification itself.
 */

const PLUGIN_DIR = __dirname;
const STUBS_DIR = path.resolve(PLUGIN_DIR, 'stubs');

// OSD shared dependencies — these are provided by the OSD runtime
// and must NOT be bundled into the plugin.
const OSD_SHARED_DEPS = {
  react: 'React',
  'react-dom': 'ReactDom',
  'react-dom/server': 'ReactDomServer',
  'react-router': 'ReactRouter',
  'react-router-dom': 'ReactRouterDom',
  '@elastic/eui': 'ElasticEui',
  '@opensearch-project/oui': 'ElasticEui',
  '@elastic/eui/lib/services': 'ElasticEuiLibServices',
  '@elastic/eui/lib/services/format': 'ElasticEuiLibServicesFormat',
  '@elastic/eui/dist/eui_charts_theme': 'ElasticEuiChartsTheme',
  '@elastic/numeral': 'ElasticNumeral',
  moment: 'Moment',
  'moment-timezone': 'MomentTimezone',
  lodash: 'Lodash',
  'lodash/fp': 'LodashFp',
  jquery: 'Jquery',
  '@osd/i18n': 'OsdI18n',
  '@osd/i18n/react': 'OsdI18nReact',
};

const osdDepKeys = Object.keys(OSD_SHARED_DEPS);

module.exports = {
  mode: 'none',
  devtool: false,

  entry: './public/index.ts',

  output: {
    filename: 'myPlugin.plugin.js',
    path: path.resolve(PLUGIN_DIR, 'build/myPlugin/target/public'),
    library: { type: 'var', name: '__myPlugin_exports__' },
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      // Map OSD monorepo relative imports to local stubs.
      // These resolve the '../../../src/core/public' imports that plugin.ts
      // and types.ts use when running outside the OSD monorepo.
      [path.resolve(PLUGIN_DIR, 'public/../../../src/core/public')]: path.resolve(
        STUBS_DIR,
        'src/core/public'
      ),
      [path.resolve(PLUGIN_DIR, 'public/components/../../../../src/core/public')]: path.resolve(
        STUBS_DIR,
        'src/core/public'
      ),
      [path.resolve(PLUGIN_DIR, 'public/../../../src/plugins/navigation/public')]: path.resolve(
        STUBS_DIR,
        'src/plugins/navigation/public'
      ),
      [path.resolve(PLUGIN_DIR, 'public/components/../../../../src/plugins/navigation/public')]:
        path.resolve(STUBS_DIR, 'src/plugins/navigation/public'),
    },
  },

  externals: [
    function ({ request }, callback) {
      // Exact match for OSD shared deps
      if (OSD_SHARED_DEPS[request]) {
        return callback(null, '__osdSharedDeps__.' + OSD_SHARED_DEPS[request]);
      }
      // Sub-path match (e.g., @elastic/eui/lib/components/...)
      for (const pkg of osdDepKeys) {
        if (request.startsWith(pkg + '/')) {
          return callback(null, '__osdSharedDeps__.' + OSD_SHARED_DEPS[pkg]);
        }
      }
      // OSD core/public and navigation/public — these are type-only imports.
      // The actual objects are passed as arguments to the plugin at runtime.
      if (
        request.includes('src/core/public') ||
        request.includes('src/plugins/navigation/public')
      ) {
        return callback(null, '{}');
      }
      callback();
    },
  ],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(PLUGIN_DIR, 'tsconfig.osd.json'),
            transpileOnly: true,
          },
        },
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
    // Wrap the bundle in __osdBundles__.define()
    new (class OsdBundleWrapperPlugin {
      apply(compiler) {
        compiler.hooks.compilation.tap('OsdBundleWrapper', (compilation) => {
          compilation.hooks.processAssets.tap(
            {
              name: 'OsdBundleWrapper',
              stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
            },
            (assets) => {
              for (const [name, source] of Object.entries(assets)) {
                if (name.endsWith('.js')) {
                  const wrapped = new webpack.sources.ConcatSource(
                    '__osdBundles__.define("plugin/myPlugin/public", function() {\n',
                    source,
                    '\nreturn __myPlugin_exports__;\n});\n'
                  );
                  compilation.updateAsset(name, wrapped);
                }
              }
            }
          );
        });
      }
    })(),

    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
  ],

  optimization: {
    minimize: false,
    splitChunks: false,
    usedExports: false,
    sideEffects: false,
  },

  performance: {
    maxAssetSize: 5 * 1024 * 1024,
    maxEntrypointSize: 5 * 1024 * 1024,
  },
};
