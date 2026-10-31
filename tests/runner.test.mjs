import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, buildClaudeArgs, formatDigest, extractJson, isIdeActive, resolveVisibilityMode, TASK_PRESETS } from '../scripts/claude-runner.mjs';

test('parseArgs correctly parses CLI options', () => {
  const argv = [
    '--mode', 'worktree',
    '--prompt', 'Write test case',
    '--max-turns', '10',
    '--max-budget-usd', '2.50',
    '--permission-mode', 'acceptEdits',
    '--open-vscode',
    '--visible'
  ];

  const opts = parseArgs(argv);
  assert.equal(opts.mode, 'worktree');
  assert.equal(opts.prompt, 'Write test case');
  assert.equal(opts.maxTurns, 10);
  assert.equal(opts.maxBudgetUsd, 2.50);
  assert.equal(opts.permissionMode, 'acceptEdits');
  assert.equal(opts.openVscode, true);
  assert.equal(opts.visible, true);
});

test('parseArgs applies task preset configurations', () => {
  const opts = parseArgs(['--task', 'boilerplate', '--prompt', 'Scaffold widget']);
  assert.equal(opts.task, 'boilerplate');
  assert.equal(opts.mode, 'worktree');
  assert.equal(opts.tools, 'Read,Write,Edit,Grep,Glob');
  assert.ok(opts.systemPrompt.includes('boilerplate'));

  const scanOpts = parseArgs(['--task', 'scan', '--prompt', 'Find unused imports']);
  assert.equal(scanOpts.mode, 'read');
  assert.equal(scanOpts.tools, 'Read,Grep,Glob');
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
  assert.ok(flags.includes('--allowedTools'), 'Must pass allowedTools');
  assert.ok(flags.includes('*'), 'Default allowedTools must be * to avoid MCP stalls');
});

test('buildClaudeArgs sets flags for worktree mode', () => {
  const opts = parseArgs(['--mode', 'worktree', '--prompt', 'Refactor module']);
  const flags = buildClaudeArgs(opts);

  assert.ok(flags.includes('--worktree'), 'Worktree mode must pass --worktree');
  assert.ok(flags.includes('--permission-mode'), 'Must specify permission mode');
  assert.ok(flags.includes('acceptEdits'), 'Worktree mode must default to acceptEdits');
});

test('extractJson extracts JSON from output with warning prefixes', () => {
  const prefixedOutput = `[claude-code:unrecognized_model] {"model":"nvidia/nemotron-3-ultra-550b-a55b:free","query_source":"sdk"}
{"result":"Verified finding list","total_cost_usd":0.05,"session_id":"test-123"}`;

  const parsed = extractJson(prefixedOutput);
  assert.ok(parsed, 'Must successfully parse JSON payload');
  assert.equal(parsed.result, 'Verified finding list');
  assert.equal(parsed.session_id, 'test-123');
});

test('resolveVisibilityMode honors explicit flags and cascades correctly', () => {
  assert.equal(resolveVisibilityMode({ headless: true }), 'headless');
  assert.equal(resolveVisibilityMode({ visible: true }), 'panel');
  assert.equal(resolveVisibilityMode({ openVscode: true }), 'panel');

  // Automatic cascade should return 'panel', 'terminal', or 'headless'
  const mode = resolveVisibilityMode({});
  assert.ok(['panel', 'terminal', 'headless'].includes(mode));
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

test('formatDigest handles turn limit errors without dumping raw json', () => {
  const turnLimitOutput = {
    session_id: 'turn-session-456',
    total_cost_usd: 0.12,
    is_error: true,
    subtype: 'error_max_turns',
    errors: ['Reached maximum number of turns (3)']
  };

  const digest = formatDigest(JSON.stringify(turnLimitOutput), '.agents/tmp/claude-runs/turn.json', 'turn-session-456');
  assert.ok(digest.includes('Status: STOPPED'));
  assert.ok(digest.includes('Reached maximum number of turns'));
  assert.ok(digest.includes('--max-turns'));
  assert.ok(!digest.includes('"subtype":"error_max_turns"'));
});
