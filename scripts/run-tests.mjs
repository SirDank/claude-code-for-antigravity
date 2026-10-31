#!/usr/bin/env node

/**
 * Cross-platform test runner.
 * Discovers and passes test files explicitly to node --test,
 * preventing Windows cmd.exe globbing failures on Node 18 and 20.
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const testsDir = resolve('tests');
const files = readdirSync(testsDir)
  .filter(f => f.endsWith('.test.mjs'))
  .map(f => join('tests', f));

if (files.length === 0) {
  console.error('No test files found in tests/');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit'
});

process.exit(result.status ?? 0);

