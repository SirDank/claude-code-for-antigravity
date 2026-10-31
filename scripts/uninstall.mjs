#!/usr/bin/env node

/**
 * Cleanup script to remove temporary session run artifacts, worktrees, and caches.
 */

import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const targets = [
  resolve('.agents', 'tmp'),
  resolve('.claude-runs'),
  resolve('.claude', 'worktrees'),
  resolve('.claude', 'tmp'),
  resolve('worktrees')
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

// Prune git worktree metadata
try {
  execSync('git worktree prune', { stdio: 'ignore' });
  console.log('Pruned git worktree references.');
} catch {}

console.log(`Cleanup complete. Removed ${cleaned} item(s).`);
process.exit(0);
