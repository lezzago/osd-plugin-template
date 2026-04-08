#!/usr/bin/env node
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Validates that all source files have the Apache 2.0 license header
 * and all third-party dependencies use Apache 2.0-compatible licenses.
 *
 * Usage: node scripts/check-licenses.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HEADER_PATTERN = /Copyright OpenSearch Contributors|SPDX-License-Identifier: Apache-2.0/;

// Apache 2.0-compatible licenses (permissive open source)
const ALLOWED_LICENSES =
  /^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2.0|0BSD|CC0-1\.0|CC-BY-[34]\.0|Unlicense|BlueOak-1\.0\.0|Python-2\.0|WTFPL|MIT-0|\(MIT OR CC0-1\.0\)|\(AFL-2\.1 OR BSD-3-Clause\)|\["MIT","Apache2"\])$/i;

let exitCode = 0;

// --- Part 1: Check license headers in source files ---
console.log('=== Checking license headers ===\n');

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.scss'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'target', 'coverage'];

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const sourceFiles = walkDir(ROOT);
const missingHeaders = [];

for (const file of sourceFiles) {
  const head = fs.readFileSync(file, 'utf8').substring(0, 300);
  if (!HEADER_PATTERN.test(head)) {
    missingHeaders.push(path.relative(ROOT, file));
  }
}

if (missingHeaders.length > 0) {
  console.log('FAIL: Missing Apache 2.0 license header:\n');
  for (const f of missingHeaders) {
    console.log(`  ${f}`);
  }
  console.log(
    '\nExpected header:\n  /*\n   * Copyright OpenSearch Contributors\n   * SPDX-License-Identifier: Apache-2.0\n   */\n'
  );
  exitCode = 1;
} else {
  console.log(`OK: All ${sourceFiles.length} source files have license headers.\n`);
}

// --- Part 2: Check third-party dependency licenses ---
console.log('=== Checking dependency licenses ===\n');

const nmDir = path.join(ROOT, 'node_modules');
if (fs.existsSync(nmDir)) {
  const issues = [];
  const counts = {};

  for (const entry of fs.readdirSync(nmDir)) {
    const pkgPaths = entry.startsWith('@')
      ? fs.readdirSync(path.join(nmDir, entry)).map((sub) => path.join(entry, sub))
      : [entry];

    for (const pkg of pkgPaths) {
      try {
        const pj = JSON.parse(
          fs.readFileSync(path.join(nmDir, pkg, 'package.json'), 'utf8')
        );
        const raw = pj.license || (pj.licenses && pj.licenses.map((l) => l.type || l).join(' OR '));
        const lic = typeof raw === 'object' ? raw.type || JSON.stringify(raw) : raw || 'UNKNOWN';
        counts[lic] = (counts[lic] || 0) + 1;

        if (!ALLOWED_LICENSES.test(lic)) {
          // Check for MIT-style LICENSE file as fallback
          const licFile = [
            path.join(nmDir, pkg, 'LICENSE'),
            path.join(nmDir, pkg, 'LICENCE'),
            path.join(nmDir, pkg, 'LICENSE.md'),
          ].find((f) => fs.existsSync(f));

          if (licFile) {
            const content = fs.readFileSync(licFile, 'utf8');
            if (/permission is hereby granted/i.test(content)) {
              // MIT-style license in file
              counts[lic]--;
              counts['MIT (from file)'] = (counts['MIT (from file)'] || 0) + 1;
              continue;
            }
          }
          issues.push(`${pkg} => ${lic}`);
        }
      } catch (e) {
        // Skip packages that can't be read
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log('License distribution:');
  for (const [lic, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lic}: ${count}`);
  }
  console.log('');

  if (issues.length > 0) {
    console.log('FAIL: Non-permissive or unknown licenses found:\n');
    for (const i of issues) {
      console.log(`  ${i}`);
    }
    console.log(
      '\nAllowed licenses: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, CC0-1.0, 0BSD, Unlicense'
    );
    exitCode = 1;
  } else {
    console.log(`OK: All ${total} packages have Apache 2.0-compatible licenses.\n`);
  }
} else {
  console.log('SKIP: node_modules not found (run yarn install first)\n');
}

process.exit(exitCode);
