/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// __dirname = standalone/
const STANDALONE_DIR = __dirname;
const PLUGIN_ROOT = path.resolve(STANDALONE_DIR, '..');

module.exports = {
  mode: 'development',
  // Entry is standalone/client.tsx — uses absolute path so it works
  // regardless of which directory webpack is invoked from.
  entry: path.resolve(STANDALONE_DIR, 'client.tsx'),
  output: {
    path: path.resolve(STANDALONE_DIR, 'dist/standalone/client'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    // Allow imports to resolve from both standalone/ and plugin root
    modules: [
      path.resolve(STANDALONE_DIR, 'node_modules'),
      path.resolve(PLUGIN_ROOT, 'node_modules'),
      'node_modules',
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
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
    new HtmlWebpackPlugin({
      template: path.resolve(STANDALONE_DIR, 'index.html'),
    }),
    // OUI imports optional deps (@opensearch/datemath) for date picker components
    // that this plugin doesn't use. Ignore them rather than installing OSD-internal packages.
    new webpack.IgnorePlugin({ resourceRegExp: /^@opensearch\/datemath$/ }),
  ],
  devtool: 'source-map',
};
