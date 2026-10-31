import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveClaudeBinary, loadClaudeSettings } from '../scripts/claude-runner.mjs';
import { ensureGitignoreSafeguards } from '../scripts/claude-doctor.mjs';

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

test('ensureGitignoreSafeguards appends missing safeguard patterns', () => {
  const testDir = mkdtempSync(join(tmpdir(), 'doctor-test-'));
  try {
    const added = ensureGitignoreSafeguards(testDir);
    assert.deepEqual(added, ['.claude/', 'worktrees/']);
    assert.ok(existsSync(join(testDir, '.gitignore')));
    const content = readFileSync(join(testDir, '.gitignore'), 'utf-8');
    assert.ok(content.includes('.claude/'));
    assert.ok(content.includes('worktrees/'));

    // Second run should add nothing
    const addedSecond = ensureGitignoreSafeguards(testDir);
    assert.deepEqual(addedSecond, []);
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});

