import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveClaudeBinary, loadClaudeSettings } from '../scripts/claude-runner.mjs';

test('resolveClaudeBinary detects binary if installed', () => {
  const bin = resolveClaudeBinary();
  // If the machine has Claude Code installed in VS Code or PATH, bin should be non-null string
  if (bin) {
    assert.equal(typeof bin, 'string');
    assert.ok(bin.toLowerCase().includes('claude'));
  }
});

test('loadClaudeSettings parses settings structure if present', () => {
  const settings = loadClaudeSettings();
  if (settings) {
    assert.ok(settings.path, 'Settings info must contain path');
    assert.ok(typeof settings.data === 'object', 'Settings info must contain parsed data object');
  }
});

