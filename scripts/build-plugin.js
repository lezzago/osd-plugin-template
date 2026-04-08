#!/usr/bin/env node
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Build the OSD plugin zip: build/myPlugin.zip
 *
 * The zip structure is:
 *   opensearch-dashboards/myPlugin/
 *     opensearch_dashboards.json
 *     package.json
 *     server/   (source code — OSD compiles at load time)
 *     core/     (shared business logic)
 *     common/   (shared constants)
 *     build/public/  (client bundle)
 *
 * Usage: node scripts/build-plugin.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'myPlugin';
const ROOT_DIR = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const STAGING_DIR = path.join(BUILD_DIR, 'staging', 'opensearch-dashboards', PLUGIN_NAME);

function run(cmd, opts = {}) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT_DIR, ...opts });
}

function copyDir(src, dest, excludePatterns = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const rel = path.relative(ROOT_DIR, srcPath);

    if (excludePatterns.some((p) => rel.includes(p))) continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, excludePatterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`=== Building ${PLUGIN_NAME} OSD plugin ===\n`);

// 1. Clean
console.log('[1/5] Cleaning previous build...');
fs.rmSync(BUILD_DIR, { recursive: true, force: true });
fs.mkdirSync(STAGING_DIR, { recursive: true });

// 2. Install deps
if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
  console.log('[2/5] Installing dependencies...');
  run('yarn install');
} else {
  console.log('[2/5] Dependencies already installed, skipping.');
}

// 3. Copy server-side source (OSD compiles TypeScript at load time)
console.log('[3/5] Copying server-side source...');
const excludes = ['__tests__', '__mocks__', '.test.', 'node_modules'];
copyDir(path.join(ROOT_DIR, 'server'), path.join(STAGING_DIR, 'server'), excludes);
copyDir(path.join(ROOT_DIR, 'core'), path.join(STAGING_DIR, 'core'), excludes);
copyDir(path.join(ROOT_DIR, 'common'), path.join(STAGING_DIR, 'common'), excludes);

// 4. Build client bundle
console.log('[4/5] Building client bundle with webpack...');
run('npx webpack --config webpack.osd.config.js');

const bundleSrc = path.join(BUILD_DIR, 'public', `${PLUGIN_NAME}.plugin.js`);
const bundleDest = path.join(STAGING_DIR, 'build', 'public');
fs.mkdirSync(bundleDest, { recursive: true });
fs.copyFileSync(bundleSrc, path.join(bundleDest, `${PLUGIN_NAME}.plugin.js`));

// Copy public source (OSD needs it for some loading paths)
copyDir(path.join(ROOT_DIR, 'public'), path.join(STAGING_DIR, 'public'), excludes);

// 5. Copy metadata + package
console.log('[5/5] Packaging plugin zip...');
fs.copyFileSync(
  path.join(ROOT_DIR, 'opensearch_dashboards.json'),
  path.join(STAGING_DIR, 'opensearch_dashboards.json')
);
fs.copyFileSync(
  path.join(ROOT_DIR, 'package.json'),
  path.join(STAGING_DIR, 'package.json')
);

// Create zip
const stagingRoot = path.join(BUILD_DIR, 'staging');
const zipPath = path.join(BUILD_DIR, `${PLUGIN_NAME}.zip`);

// Use system zip (available on macOS and Linux)
run(`zip -r "${zipPath}" opensearch-dashboards/ -x '*.test.*' '*__tests__*' '*__mocks__*'`, {
  cwd: stagingRoot,
});

// Cleanup staging
fs.rmSync(stagingRoot, { recursive: true, force: true });

const stats = fs.statSync(zipPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

console.log(`\n=== Build complete ===`);
console.log(`  Output: ${zipPath} (${sizeMB} MB)`);
console.log(`  Structure: opensearch-dashboards/${PLUGIN_NAME}/`);
