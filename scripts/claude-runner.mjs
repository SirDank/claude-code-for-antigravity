#!/usr/bin/env node

/**
 * Cross-platform runner script for executing Claude Code CLI (claude -p)
 * and managing VS Code handoffs from Google Antigravity.
 */

import { spawn, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { homedir, platform } from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 * Task presets for offloading mundane, low-intelligence, or high-volume tasks
 * to save Antigravity quota and tokens using budget/free OpenRouter models.
 */
export const TASK_PRESETS = {
  boilerplate: {
    tools: 'Read,Write,Edit,Grep,Glob',
    mode: 'worktree',
    systemPrompt: 'You are an autonomous boilerplate and scaffolding generator. Generate clean, minimal, compile-ready code without commentary or conversational filler to conserve tokens.'
  },
  docs: {
    tools: 'Read,Write,Edit,Grep,Glob',
    mode: 'worktree',
    systemPrompt: 'You are an autonomous documentation assistant. Generate exact docstrings, markdown documents, or API annotations strictly conforming to project conventions.'
  },
  scan: {
    tools: 'Read,Grep,Glob',
    mode: 'read',
    systemPrompt: 'You are an autonomous codebase scanner. Search logs, find dead code, duplicate patterns, or references, and return a compact, structured list of file locations and findings.'
  },
  review: {
    tools: 'Read,Grep,Glob',
    mode: 'read',
    systemPrompt: 'You are an adversarial code reviewer. Inspect the changes for bugs, boundary errors, security flaws, and regressions. Output a terse bulleted list.'
  }
};

/**
 * Resolves the Claude CLI binary across PATH and VS Code extension caches.
 */
export function resolveClaudeBinary() {
  if (process.env.CLAUDE_PATH && existsSync(process.env.CLAUDE_PATH)) {
    return process.env.CLAUDE_PATH;
  }

  // 1. Check system PATH
  try {
    const cmd = platform() === 'win32' ? 'where.exe claude' : 'which claude';
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const firstLine = stdout.split(/\r?\n/)[0];
    if (firstLine && existsSync(firstLine)) {
      return firstLine;
    }
  } catch {
    // Not found in PATH
  }

  // 2. Check VS Code extension native binary locations
  const home = homedir();
  const searchRoots = [
    join(home, '.vscode', 'extensions'),
    join(home, '.vscode-insiders', 'extensions')
  ];

  for (const root of searchRoots) {
    if (!existsSync(root)) continue;
    try {
      const dirs = readdirSync(root).filter(d => d.startsWith('anthropic.claude-code-'));
      // Sort descending to find the newest version
      dirs.sort().reverse();
      for (const d of dirs) {
        const binName = platform() === 'win32' ? 'claude.exe' : 'claude';
        const candidate = join(root, d, 'resources', 'native-binary', binName);
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  return null;
}

/**
 * Locates and loads environment configurations from .claude/settings.local.json,
 * .claude/settings.json, or VS Code global settings (claudeCode.environmentVariables).
 */
export function loadClaudeSettings(startDir = process.cwd()) {
  let cur = resolve(startDir);
  const root = resolve('/');

  while (cur !== root && dirname(cur) !== cur) {
    const localSettings = join(cur, '.claude', 'settings.local.json');
    if (existsSync(localSettings)) {
      try {
        const data = JSON.parse(readFileSync(localSettings, 'utf-8'));
        return { path: localSettings, data };
      } catch {}
    }
    const sharedSettings = join(cur, '.claude', 'settings.json');
    if (existsSync(sharedSettings)) {
      try {
        const data = JSON.parse(readFileSync(sharedSettings, 'utf-8'));
        return { path: sharedSettings, data };
      } catch {}
    }
    cur = dirname(cur);
  }

  // Check home directory fallback
  const homeSettings = join(homedir(), '.claude', 'settings.json');
  if (existsSync(homeSettings)) {
    try {
      const data = JSON.parse(readFileSync(homeSettings, 'utf-8'));
      if (data && data.env) {
        return { path: homeSettings, data };
      }
    } catch {}
  }

  // Check VS Code global user settings fallback (claudeCode.environmentVariables)
  const vscSettings = platform() === 'win32'
    ? join(process.env.APPDATA || '', 'Code', 'User', 'settings.json')
    : platform() === 'darwin'
      ? join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json')
      : join(homedir(), '.config', 'Code', 'User', 'settings.json');

  if (existsSync(vscSettings)) {
    try {
      const raw = readFileSync(vscSettings, 'utf-8');
      const envMatch = raw.match(/"claudeCode\.environmentVariables"\s*:\s*(\[[^\]]+\])/s);
      if (envMatch) {
        const list = JSON.parse(envMatch[1]);
        const env = {};
        for (const item of list) {
          if (item.name && item.value !== undefined) {
            env[item.name] = item.value;
          }
        }
        return { path: vscSettings, data: { env, model: env.ANTHROPIC_MODEL } };
      }
    } catch {}
  }

  if (existsSync(homeSettings)) {
    try {
      const data = JSON.parse(readFileSync(homeSettings, 'utf-8'));
      return { path: homeSettings, data };
    } catch {}
  }

  return null;
}

/**
 * Parses command-line arguments into structured runner configuration.
 */
export function parseArgs(args) {
  const options = {
    mode: 'read', // 'read' or 'worktree'
    task: null,   // preset: 'boilerplate', 'docs', 'scan', 'review'
    prompt: '',
    promptFile: null,
    tools: null,
    allowedTools: null,
    disallowedTools: null,
    permissionMode: null,
    maxTurns: 15,
    maxBudgetUsd: null,
    sessionId: null,
    resume: null,
    worktree: false,
    safeMode: false,
    connectIde: false,
    openVscode: false,
    visible: false,
    headless: false,
    systemPrompt: null,
    verbose: false,
    extraArgs: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      options.mode = args[++i];
    } else if (arg === '--task' && args[i + 1]) {
      options.task = args[++i];
    } else if (arg === '--prompt' && args[i + 1]) {
      options.prompt = args[++i];
    } else if (arg === '--prompt-file' && args[i + 1]) {
      options.promptFile = args[++i];
    } else if (arg === '--tools' && args[i + 1]) {
      options.tools = args[++i];
    } else if (arg === '--allowedTools' && args[i + 1]) {
      options.allowedTools = args[++i];
    } else if (arg === '--disallowedTools' && args[i + 1]) {
      options.disallowedTools = args[++i];
    } else if (arg === '--permission-mode' && args[i + 1]) {
      options.permissionMode = args[++i];
    } else if (arg === '--max-turns' && args[i + 1]) {
      options.maxTurns = parseInt(args[++i], 10);
    } else if (arg === '--max-budget-usd' && args[i + 1]) {
      options.maxBudgetUsd = parseFloat(args[++i]);
    } else if (arg === '--session-id' && args[i + 1]) {
      options.sessionId = args[++i];
    } else if (arg === '--resume' && args[i + 1]) {
      options.resume = args[++i];
    } else if (arg === '--worktree') {
      options.worktree = true;
    } else if (arg === '--safe-mode') {
      options.safeMode = true;
    } else if (arg === '--connect-ide') {
      options.connectIde = true;
    } else if (arg === '--open-vscode') {
      options.openVscode = true;
    } else if (arg === '--visible') {
      options.visible = true;
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--append-system-prompt' && args[i + 1]) {
      options.systemPrompt = args[++i];
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      options.extraArgs.push(arg);
    }
  }

  // Apply task preset defaults if requested
  if (options.task && TASK_PRESETS[options.task]) {
    const preset = TASK_PRESETS[options.task];
    if (preset.mode && !args.includes('--mode')) {
      options.mode = preset.mode;
    }
    if (preset.tools && !options.tools && !options.allowedTools) {
      options.tools = preset.tools;
    }
    if (preset.systemPrompt) {
      options.systemPrompt = options.systemPrompt
        ? `${preset.systemPrompt}\n${options.systemPrompt}`
        : preset.systemPrompt;
    }
  }

  return options;
}

/**
 * Builds the array of flags to pass to claude CLI.
 */
export function buildClaudeArgs(options) {
  const flags = ['-p'];

  let finalPrompt = options.prompt;
  if (!finalPrompt && options.promptFile && existsSync(options.promptFile)) {
    finalPrompt = readFileSync(options.promptFile, 'utf-8');
  }

  flags.push(finalPrompt || 'Perform diagnostic check.');
  flags.push('--output-format', 'json');

  if (options.sessionId) {
    flags.push('--session-id', options.sessionId);
  }
  if (options.resume) {
    flags.push('--resume', options.resume);
  }

  if (options.mode === 'worktree' || options.worktree) {
    flags.push('--worktree');
    flags.push('--permission-mode', options.permissionMode || 'acceptEdits');
  } else {
    // Mode 'read' defaults
    flags.push('--permission-mode', options.permissionMode || 'dontAsk');
    if (!options.tools && !options.allowedTools) {
      flags.push('--tools', 'Read,Grep,Glob');
    }
  }

  if (options.tools) {
    flags.push('--tools', options.tools);
  }
  if (options.allowedTools) {
    flags.push('--allowedTools', options.allowedTools);
  }
  if (options.disallowedTools) {
    flags.push('--disallowedTools', options.disallowedTools);
  }

  if (options.maxTurns) {
    flags.push('--max-turns', String(options.maxTurns));
  }
  if (options.maxBudgetUsd) {
    flags.push('--max-budget-usd', String(options.maxBudgetUsd));
  }
  if (options.safeMode) {
    flags.push('--safe-mode');
  }
  if (options.systemPrompt) {
    flags.push('--append-system-prompt', options.systemPrompt);
  }

  if (options.extraArgs && options.extraArgs.length > 0) {
    flags.push(...options.extraArgs);
  }

  return flags;
}

/**
 * Formats a compact Honey Lever 3 digest from the raw Claude Code JSON output.
 */
export function formatDigest(rawJson, artifactPath, sessionId) {
  let parsed;
  try {
    parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch {
    parsed = { result: String(rawJson) };
  }

  const sid = parsed.session_id || sessionId || 'unknown';
  const cost = parsed.total_cost_usd !== undefined ? `$${parsed.total_cost_usd.toFixed(4)}` : 'N/A';
  const resultText = parsed.result || parsed.structured_output || (typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson));
  
  // Truncate summary cleanly to avoid blowing up parent agent context window
  const summary = String(resultText).trim().slice(0, 1800);

  return [
    '=== CLAUDE RUN DIGEST ===',
    `Status: SUCCESS`,
    `Session ID: ${sid}`,
    `Total Cost: ${cost}`,
    `Run Artifact: ${artifactPath}`,
    `Summary:`,
    summary,
    '========================='
  ].join('\n');
}

/**
 * Opens VS Code URI handoff handler to show session in the Claude Code tab.
 */
export function openVscodeUri(sessionId, promptText = '') {
  const encPrompt = encodeURIComponent(promptText || '');
  const uri = `vscode://anthropic.claude-code/open?session=${sessionId}&prompt=${encPrompt}`;
  
  try {
    if (platform() === 'win32') {
      execSync(`cmd.exe /c start "" "${uri}"`, { stdio: 'ignore' });
    } else if (platform() === 'darwin') {
      execSync(`open "${uri}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${uri}"`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

function printHelp() {
  console.log(`
Usage: node scripts/claude-runner.mjs [options]

Quota-Saving Presets:
  --task <preset>               Preset for mundane offloading:
                                  boilerplate - Scaffolding & models
                                  docs        - JSDoc, Dartdoc, markdown
                                  scan        - Large log searches, dead code
                                  review      - Fast first-pass diff audit

Visibility Options:
  --visible                     Open active Claude Code tab & stream live stdout
  --headless                    Run silently in background with digest return

Execution Options:
  --mode <read|worktree>        Task mode: 'read' (read-only) or 'worktree' (code modification)
  --prompt <string>             Instruction prompt for Claude Code
  --prompt-file <path>          File containing instruction prompt
  --session-id <uuid>           Custom session identifier
  --resume <uuid>               Resume an existing session
  --tools <list>                Allowed tool list (e.g. "Read,Grep,Glob")
  --allowedTools <list>         Permission auto-grant list
  --permission-mode <mode>      'dontAsk', 'acceptEdits', 'auto', 'bypassPermissions'
  --max-turns <n>               Maximum turns (default: 15)
  --max-budget-usd <amount>     Maximum budget in USD
  --connect-ide                 Allow auto-connecting to VS Code extension MCP server
  --open-vscode                 Open session in Claude Code VS Code panel upon completion
  --safe-mode                   Disable third-party hooks and untrusted configurations
  --verbose                     Print raw streaming logs
  --help, -h                    Show this help screen
`);
}

// Main execution when called directly
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const binary = resolveClaudeBinary();
  if (!binary) {
    console.error('ERROR: Claude CLI binary not found on PATH or in VS Code extension directories.');
    console.error('Run: node scripts/claude-doctor.mjs for diagnostic assistance.');
    process.exit(1);
  }

  const settingsInfo = loadClaudeSettings();
  const env = { ...process.env };

  // Inherit environment variables from .claude/settings.local.json or VS Code settings
  if (settingsInfo && settingsInfo.data && settingsInfo.data.env) {
    for (const [k, v] of Object.entries(settingsInfo.data.env)) {
      if (v) env[k] = v;
    }
  }

  // Isolate headless calls from active VS Code chat panel lockfile unless explicitly requested
  if (!options.connectIde && !env.CLAUDE_CODE_AUTO_CONNECT_IDE) {
    env.CLAUDE_CODE_AUTO_CONNECT_IDE = 'false';
  }

  const sessionId = options.sessionId || `run-${Date.now()}`;

  // If visible mode is enabled, activate the Claude Code tab in VS Code immediately
  if (options.visible || options.openVscode) {
    openVscodeUri(sessionId, options.prompt);
  }

  const claudeArgs = buildClaudeArgs({ ...options, sessionId });

  if (options.verbose) {
    console.log(`[Runner] Executing: ${binary} ${claudeArgs.join(' ')}`);
  }

  const child = spawn(binary, claudeArgs, {
    env,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';

  child.stdout.on('data', chunk => {
    stdoutBuffer += chunk.toString();
    if (options.verbose || options.visible) {
      process.stdout.write(chunk);
    }
  });

  child.stderr.on('data', chunk => {
    stderrBuffer += chunk.toString();
    if (options.verbose || options.visible) {
      process.stderr.write(chunk);
    }
  });

  // Graceful termination handler
  let isTerminating = false;
  const onSignal = (sig) => {
    if (isTerminating) return;
    isTerminating = true;
    child.kill('SIGINT');
    setTimeout(() => {
      child.kill('SIGTERM');
    }, 2000);
  };

  process.on('SIGINT', () => onSignal('SIGINT'));
  process.on('SIGTERM', () => onSignal('SIGTERM'));

  child.on('close', code => {
    // Generate artifact path
    const runDir = resolve('.agents', 'tmp', 'claude-runs');
    if (!existsSync(runDir)) {
      mkdirSync(runDir, { recursive: true });
    }

    const artifactPath = join(runDir, `${sessionId}.json`);

    try {
      writeFileSync(artifactPath, stdoutBuffer || JSON.stringify({ stdout: stdoutBuffer, stderr: stderrBuffer }, null, 2));
    } catch {}

    // Clean up temporary worktree references if worktree mode was active
    if (options.mode === 'worktree' || options.worktree) {
      try {
        execSync('git worktree prune', { stdio: 'ignore' });
      } catch {}
    }

    if (code === 0) {
      console.log(formatDigest(stdoutBuffer, artifactPath, sessionId));
      process.exit(0);
    } else {
      console.error(`=== CLAUDE RUN FAILED (exit code: ${code}) ===`);
      if (stderrBuffer) console.error(`Error:\n${stderrBuffer.trim()}`);
      if (stdoutBuffer) console.log(formatDigest(stdoutBuffer, artifactPath, sessionId));
      process.exit(code || 1);
    }
  });
}
