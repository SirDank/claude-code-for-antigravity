#!/usr/bin/env node

/**
 * Cleanup script to remove temporary session run artifacts and caches.
 */

import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = [
  resolve('.agents', 'tmp', 'claude-runs'),
  resolve('.claude-runs')
];

let cleaned = 0;

for (const target of targets) {
  if (existsSync(target)) {
    try {
      rmSync(target, { recursive: true, force: true });
      console.log(`Cleaned: ${target}`);
      cleaned++;
    } catch (err) {
      console.error(`Failed to remove ${target}: ${err.message}`);
    }
  }
}

console.log(`Cleanup complete. Removed ${cleaned} item(s).`);
process.exit(0);

