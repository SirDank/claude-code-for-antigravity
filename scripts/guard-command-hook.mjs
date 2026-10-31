#!/usr/bin/env node

/**
 * Antigravity PreToolUse hook for run_command.
 * Guards against unsafe execution flags and blocks accidental un-sandboxed operations.
 */

let input = '';

process.stdin.on('data', chunk => {
  input += chunk.toString();
});

process.stdin.on('end', () => {
  try {
    let payload = {};
    if (input.trim()) {
      payload = JSON.parse(input);
    }

    const commandLine = payload.toolArgs?.CommandLine || payload.CommandLine || '';

    // Block accidental dangerously-skip-permissions unless explicitly allowed
    if (commandLine.includes('--dangerously-skip-permissions') && !process.env.ALLOW_DANGEROUS_PERMISSIONS) {
      console.log(JSON.stringify({
        decision: 'reject',
        reason: 'Execution blocked: --dangerously-skip-permissions requires explicit environment authorization (ALLOW_DANGEROUS_PERMISSIONS=1).'
      }));
      process.exit(0);
    }

    // Default to proceed
    console.log(JSON.stringify({ decision: 'proceed' }));
    process.exit(0);
  } catch (err) {
    // Fail open per Antigravity hook spec
    console.log(JSON.stringify({ decision: 'proceed', note: err.message }));
    process.exit(0);
  }
});

