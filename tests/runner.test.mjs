import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, buildClaudeArgs, formatDigest } from '../scripts/claude-runner.mjs';

test('parseArgs correctly parses CLI options', () => {
  const argv = [
    '--mode', 'worktree',
    '--prompt', 'Write test case',
    '--max-turns', '10',
    '--max-budget-usd', '2.50',
    '--permission-mode', 'acceptEdits',
    '--open-vscode'
  ];

  const opts = parseArgs(argv);
  assert.equal(opts.mode, 'worktree');
  assert.equal(opts.prompt, 'Write test case');
  assert.equal(opts.maxTurns, 10);
  assert.equal(opts.maxBudgetUsd, 2.50);
  assert.equal(opts.permissionMode, 'acceptEdits');
  assert.equal(opts.openVscode, true);
});

test('buildClaudeArgs sets default flags for read mode', () => {
  const opts = parseArgs(['--mode', 'read', '--prompt', 'Analyze code']);
  const flags = buildClaudeArgs(opts);

  assert.ok(flags.includes('-p'), 'Must contain headless flag -p');
  assert.ok(flags.includes('--output-format'), 'Must specify output format');
  assert.ok(flags.includes('json'), 'Must specify json format');
  assert.ok(flags.includes('--permission-mode'), 'Must specify permission mode');
  assert.ok(flags.includes('dontAsk'), 'Read mode must default to dontAsk');
  assert.ok(flags.includes('--tools'), 'Read mode must restrict tools');
  assert.ok(flags.includes('Read,Grep,Glob'), 'Read mode must include read-only tools');
});

test('buildClaudeArgs sets flags for worktree mode', () => {
  const opts = parseArgs(['--mode', 'worktree', '--prompt', 'Refactor module']);
  const flags = buildClaudeArgs(opts);

  assert.ok(flags.includes('--worktree'), 'Worktree mode must pass --worktree');
  assert.ok(flags.includes('--permission-mode'), 'Must specify permission mode');
  assert.ok(flags.includes('acceptEdits'), 'Worktree mode must default to acceptEdits');
});

test('formatDigest enforces compact digest bounds (<2000 chars)', () => {
  const largeOutput = {
    session_id: 'test-session-123',
    total_cost_usd: 0.045,
    result: 'A'.repeat(5000)
  };

  const digest = formatDigest(JSON.stringify(largeOutput), '.agents/tmp/claude-runs/test.json', 'test-session-123');
  assert.ok(digest.includes('=== CLAUDE RUN DIGEST ==='));
  assert.ok(digest.includes('test-session-123'));
  assert.ok(digest.includes('$0.0450'));
  assert.ok(digest.length < 2000, `Digest length ${digest.length} exceeds 2000 characters`);
});

