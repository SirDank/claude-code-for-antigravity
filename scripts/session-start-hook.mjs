#!/usr/bin/env node

/**
 * Antigravity SessionStart hook.
 * Performs a fast non-blocking startup check and outputs standard JSON decision.
 */

import { resolveClaudeBinary } from './claude-runner.mjs';

try {
  const bin = resolveClaudeBinary();
  const decision = {
    decision: 'proceed',
    message: bin ? `Claude Code Bridge ready (binary: ${bin})` : 'Claude Code Bridge: claude binary not found on PATH or in VS Code extension folder. Run /claude-setup for diagnostics.'
  };
  console.log(JSON.stringify(decision));
  process.exit(0);
} catch (err) {
  console.log(JSON.stringify({ decision: 'proceed', error: err.message }));
  process.exit(0);
}

