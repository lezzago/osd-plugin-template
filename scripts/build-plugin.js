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
const STUBS_DIR = path.join(ROOT_DIR, 'stubs');
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

// 3. Compile server-side TypeScript to CommonJS.
// OSD in Docker expects compiled .js files (unlike the monorepo dev mode
// which compiles TypeScript on the fly). We compile server/, core/, and common/
// into the staging directory using a temporary tsconfig.
console.log('[3/5] Compiling server-side TypeScript...');

const serverTsConfig = path.join(BUILD_DIR, 'tsconfig.server-build.json');
fs.writeFileSync(
  serverTsConfig,
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        types: ['node'],
        outDir: STAGING_DIR,
        rootDir: ROOT_DIR,
        strict: false,
        esModuleInterop: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        moduleResolution: 'node',
        declaration: false,
        sourceMap: false,
        baseUrl: ROOT_DIR,
        paths: {
          '../../../../src/core/server': [path.join(STUBS_DIR, 'src/core/server')],
          '../../../src/core/server': [path.join(STUBS_DIR, 'src/core/server')],
          '@osd/config-schema': [path.join(STUBS_DIR, '@osd/config-schema')],
        },
      },
      include: [
        path.join(ROOT_DIR, 'core/**/*.ts'),
        path.join(ROOT_DIR, 'server/**/*.ts'),
        path.join(ROOT_DIR, 'common/**/*.ts'),
      ],
      exclude: [
        path.join(ROOT_DIR, '**/__tests__/**'),
        path.join(ROOT_DIR, '**/*.test.ts'),
      ],
    },
    null,
    2
  )
);

run(`npx tsc --project "${serverTsConfig}"`);
const excludes = ['__tests__', '__mocks__', '.test.', 'node_modules'];

// 4. Build client bundle
console.log('[4/5] Building client bundle with webpack...');
run('npx webpack --config webpack.osd.config.js');

// Webpack outputs to build/myPlugin/target/public/ — copy the bundle into staging
const bundleSrc = path.join(BUILD_DIR, PLUGIN_NAME, 'target', 'public', `${PLUGIN_NAME}.plugin.js`);
const bundleDest = path.join(STAGING_DIR, 'target', 'public');
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

// Write a minimal package.json for the installed plugin.
// The `main` field must point to the client bundle so OSD can load it.
const osdPkg = {
  name: PLUGIN_NAME,
  version: '1.0.0',
  main: `target/public/${PLUGIN_NAME}.plugin.js`,
  opensearchDashboards: {
    version: '3.6.0',
    templateVersion: '1.0.0',
  },
};
fs.writeFileSync(path.join(STAGING_DIR, 'package.json'), JSON.stringify(osdPkg, null, 2));

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
