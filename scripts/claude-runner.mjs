#!/usr/bin/env node

/**
 * Cross-platform runner script for executing Claude Code CLI (claude -p)
 * and managing VS Code handoffs from Google Antigravity.
 */

import { spawn, execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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
    mode: 'auto', // 'auto', 'plan', 'edit', 'manual', 'read', 'worktree'
    task: null,   // preset: 'boilerplate', 'docs', 'scan', 'review'
    effort: 'max',// highest effort by default (max, xhigh, high, medium, low)
    prompt: '',
    promptFile: null,
    tools: null,
    allowedTools: null,
    disallowedTools: null,
    permissionMode: null,
    maxTurns: null, // Unlimited by default (no arbitrary limit)
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

  let startIndex = 0;
  if (args.length > 0 && !args[0].startsWith('-')) {
    const first = args[0].toLowerCase();
    if (['auto', 'plan', 'edit', 'manual', 'review', 'scan'].includes(first)) {
      if (first === 'review' || first === 'scan') {
        options.task = first;
        options.mode = first === 'review' ? 'plan' : 'auto';
      } else {
        options.mode = first;
      }
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      options.mode = args[++i];
    } else if (arg === '--effort' && args[i + 1]) {
      options.effort = args[++i];
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
    } else if (!options.prompt && !arg.startsWith('-')) {
      options.prompt = arg;
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

  flags.push(finalPrompt || 'Perform task.');
  flags.push('--output-format', 'json');

  // Always use highest available effort level
  flags.push('--effort', options.effort || 'max');

  if (options.sessionId) {
    flags.push('--session-id', options.sessionId);
  }
  if (options.resume) {
    flags.push('--resume', options.resume);
  }

  // Map modes to permission-mode
  const mode = options.mode || 'auto';
  let permMode = options.permissionMode;

  if (!permMode) {
    if (mode === 'plan') {
      permMode = 'plan';
    } else if (mode === 'edit' || mode === 'worktree') {
      permMode = 'acceptEdits';
    } else if (mode === 'manual') {
      permMode = 'manual';
    } else if (mode === 'read') {
      permMode = 'dontAsk';
    } else {
      permMode = 'auto';
    }
  }

  flags.push('--permission-mode', permMode);

  if (mode === 'worktree' || mode === 'edit' || options.worktree) {
    flags.push('--worktree');
  }

  if (options.tools) {
    flags.push('--tools', options.tools);
  } else if (mode === 'read' || mode === 'plan' || options.task === 'review' || options.task === 'scan') {
    flags.push('--tools', 'Read,Grep,Glob');
  }

  if (options.allowedTools) {
    flags.push('--allowedTools', options.allowedTools);
  } else {
    // Auto-allow all tools in batch mode to prevent MCP plugin permission denials from stalling execution
    flags.push('--allowedTools', '*');
  }

  if (options.disallowedTools) {
    flags.push('--disallowedTools', options.disallowedTools);
  }

  // Unlimited turns by default (only add if explicitly specified)
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
 * Detects if an active Claude Code extension instance is running in VS Code.
 * Reads ~/.claude/ide/*.lock and tests if the process PID is currently alive.
 */
export function isIdeActive() {
  const ideDir = join(homedir(), '.claude', 'ide');
  if (!existsSync(ideDir)) return null;

  try {
    const locks = readdirSync(ideDir).filter(f => f.endsWith('.lock'));
    for (const lock of locks) {
      try {
        const raw = readFileSync(join(ideDir, lock), 'utf-8');
        const data = JSON.parse(raw);
        if (data.pid) {
          try {
            process.kill(data.pid, 0);
            return { port: lock.replace('.lock', ''), ...data };
          } catch {
            // Stale lockfile
            continue;
          }
        }
      } catch {}
    }
  } catch {}

  return null;
}

/**
 * Determines runtime visibility mode based on explicit flags or automatic detection:
 * 1. Explicit override (--headless or --visible/--open-vscode)
 * 2. Auto-detect active VS Code Claude Code instance -> 'panel'
 * 3. Auto-detect interactive TTY -> 'terminal'
 * 4. Fallback -> 'headless'
 */
export function resolveVisibilityMode(options = {}) {
  if (options.headless) return 'headless';
  if (options.visible || options.openVscode) return 'panel';

  // 1. Detect and show live on VS Code panel
  const activeIde = isIdeActive();
  if (activeIde) {
    return 'panel';
  }

  // 2. Detect and show live on terminal
  if (process.stdout.isTTY) {
    return 'terminal';
  }

  // 3. Fallback to headless
  return 'headless';
}

/**
 * Resiliently extracts and parses JSON payload even when preceded by CLI warnings or logs.
 */
export function extractJson(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try { return JSON.parse(trimmed); } catch {}
  }

  // 1. Check lines from bottom up (result payload is typically on the last line)
  const lines = str.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj === 'object') return obj;
      } catch {}
    }
  }

  // 2. If line splitting fails (multi-line JSON), find matching bracket block containing result/session_id
  let end = str.lastIndexOf('}');
  while (end !== -1) {
    let depth = 0;
    for (let i = end; i >= 0; i--) {
      if (str[i] === '}') depth++;
      else if (str[i] === '{') {
        depth--;
        if (depth === 0) {
          try {
            const candidate = JSON.parse(str.slice(i, end + 1));
            if (candidate && (candidate.result !== undefined || candidate.session_id || candidate.type === 'result' || candidate.total_cost_usd !== undefined)) {
              return candidate;
            }
          } catch {}
        }
      }
    }
    end = str.lastIndexOf('}', end - 1);
  }

  // 3. Fallback to outer brackets
  const start = str.indexOf('{');
  const lastEnd = str.lastIndexOf('}');
  if (start !== -1 && lastEnd > start) {
    try {
      return JSON.parse(str.slice(start, lastEnd + 1));
    } catch {}
  }

  return null;
}

/**
 * Formats a compact Honey Lever 3 digest from the raw Claude Code JSON output.
 */
export function formatDigest(rawJson, artifactPath, sessionId) {
  const parsed = extractJson(rawJson) || { result: String(rawJson) };

  const sid = parsed.session_id || sessionId || 'unknown';
  const cost = parsed.total_cost_usd !== undefined ? `$${parsed.total_cost_usd.toFixed(4)}` : 'N/A';
  
  let resultText = parsed.result || parsed.structured_output;
  if (!resultText && parsed.errors && parsed.errors.length > 0) {
    resultText = `Execution note: ${parsed.errors.join('; ')} (Turn limit reached). Consider increasing --max-turns for complex workflows.`;
  } else if (!resultText) {
    resultText = typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson);
  }

  const summary = String(resultText).trim().slice(0, 1800);
  const status = (parsed.is_error || (parsed.errors && parsed.errors.length > 0)) ? 'STOPPED' : 'SUCCESS';

  return [
    '=== CLAUDE RUN DIGEST ===',
    `Status: ${status}`,
    `Session ID: ${sid}`,
    `Total Cost: ${cost}`,
    `Run Artifact: ${artifactPath}`,
    `Summary:`,
    summary,
    '========================='
  ].join('\n');
}

/**
 * Opens VS Code URI handoff handler to show prompt in the Claude Code tab.
 * Note: Session ID is only passed if resuming a known saved session.
 * For fresh prompts, passing an unknown session ID causes VS Code to drop initialPrompt.
 */
export function openVscodeUri(sessionId = null, promptText = '') {
  const encPrompt = encodeURIComponent(promptText || '');
  const uri = sessionId
    ? `vscode://anthropic.claude-code/open?session=${sessionId}&prompt=${encPrompt}`
    : `vscode://anthropic.claude-code/open?prompt=${encPrompt}`;

  try {
    if (platform() === 'win32') {
      execSync(`powershell.exe -NoProfile -Command "Start-Process '${uri}'"`, { stdio: 'ignore' });
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

  const sessionId = options.sessionId || randomUUID();
  const visibility = resolveVisibilityMode(options);
  const isPanel = visibility === 'panel';
  const isLiveStream = visibility === 'panel' || visibility === 'terminal' || options.verbose;

  // Auto-connect to IDE or isolate based on visibility mode
  if (isPanel) {
    openVscodeUri(options.resume || null, options.prompt);
    if (!options.connectIde && !env.CLAUDE_CODE_AUTO_CONNECT_IDE) {
      env.CLAUDE_CODE_AUTO_CONNECT_IDE = 'true';
    }
  } else if (!options.connectIde && !env.CLAUDE_CODE_AUTO_CONNECT_IDE) {
    env.CLAUDE_CODE_AUTO_CONNECT_IDE = 'false';
  }

  const claudeArgs = buildClaudeArgs({ ...options, sessionId });

  if (options.verbose) {
    console.log(`[Runner] Executing (mode: ${visibility}): ${binary} ${claudeArgs.join(' ')}`);
  }

  // Use 'ignore' on stdin to eliminate 3s hang while awaiting input
  const child = spawn(binary, claudeArgs, {
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';

  child.stdout.on('data', chunk => {
    stdoutBuffer += chunk.toString();
    if (options.verbose) {
      process.stdout.write(chunk);
    }
  });

  child.stderr.on('data', chunk => {
    stderrBuffer += chunk.toString();
    if (options.verbose) {
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
      const cleanStderr = stderrBuffer.split(/\r?\n/)
        .filter(l => !l.includes('unrecognized_model'))
        .join('\n')
        .trim();
      if (cleanStderr) console.error(`Error:\n${cleanStderr}`);
      if (stdoutBuffer) console.log(formatDigest(stdoutBuffer, artifactPath, sessionId));
      process.exit(code || 1);
    }
  });
}
