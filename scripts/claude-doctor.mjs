#!/usr/bin/env node

/**
 * Preflight doctor script for checking Claude Code CLI, Antigravity integration,
 * local settings, .gitignore safeguards, and environment readiness.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { resolveClaudeBinary, loadClaudeSettings } from './claude-runner.mjs';

/**
 * Ensures required ignores are present in repository .gitignore
 */
export function ensureGitignoreSafeguards(repoRoot = process.cwd()) {
  const gitignorePath = join(repoRoot, '.gitignore');
  const requiredPatterns = ['.claude/', '.agents/tmp/', '.claude-runs/', 'worktrees/'];
  let added = [];

  if (existsSync(gitignorePath)) {
    let content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split(/\r?\n/).map(l => l.trim());
    for (const pat of requiredPatterns) {
      if (!lines.includes(pat) && !(pat === '.claude/' && lines.includes('.claude/*'))) {
        content += (content.endsWith('\n') ? '' : '\n') + pat + '\n';
        added.push(pat);
      }
    }
    if (added.length > 0) {
      writeFileSync(gitignorePath, content, 'utf-8');
    }
  } else {
    writeFileSync(gitignorePath, requiredPatterns.join('\n') + '\n', 'utf-8');
    added = [...requiredPatterns];
  }

  return added;
}

export function runCheck() {
  const results = [];
  const home = homedir();

  console.log('\n======================================================');
  console.log(' Claude Code for Antigravity - Preflight Doctor');
  console.log('======================================================\n');

  // 1. Check Node.js
  const nodeVer = process.version;
  const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
  if (major >= 18) {
    results.push({ name: 'Node.js Runtime', status: 'PASS', detail: `Version ${nodeVer} (>= 18 required)` });
  } else {
    results.push({ name: 'Node.js Runtime', status: 'FAIL', detail: `Version ${nodeVer} is outdated. Please upgrade to Node 18+.` });
  }

  // 2. Claude CLI Binary
  const claudeBin = resolveClaudeBinary();
  if (claudeBin) {
    let versionStr = 'unknown';
    try {
      versionStr = execSync(`"${claudeBin}" --version`, { encoding: 'utf-8', timeout: 5000 }).trim();
    } catch {}
    results.push({ name: 'Claude CLI Binary', status: 'PASS', detail: `Found at ${claudeBin} (${versionStr})` });
  } else {
    results.push({
      name: 'Claude CLI Binary',
      status: 'FAIL',
      detail: 'Not found on PATH or in VS Code extension folder. Install Claude Code extension in VS Code or run npm install -g @anthropic-ai/claude-code.'
    });
  }

  // 3. Local Workspace Settings & Model Provider
  const settingsInfo = loadClaudeSettings();
  if (settingsInfo && settingsInfo.data) {
    const d = settingsInfo.data;
    const model = d.model || (d.env && d.env.ANTHROPIC_MODEL) || 'default';
    const baseUrl = (d.env && d.env.ANTHROPIC_BASE_URL) || 'native (Anthropic)';
    results.push({
      name: 'Claude Settings & Provider',
      status: 'PASS',
      detail: `Loaded from ${settingsInfo.path} | Model: ${model} | Base URL: ${baseUrl}`
    });
  } else {
    results.push({
      name: 'Claude Settings & Provider',
      status: 'INFO',
      detail: 'No local settings found. Claude will use default Anthropic credentials.'
    });
  }

  // 4. Claude Authentication Status
  if (claudeBin) {
    let authOk = false;
    let authDetail = '';
    try {
      const out = execSync(`"${claudeBin}" auth status`, { encoding: 'utf-8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      authOk = true;
      authDetail = out || 'Authenticated';
    } catch {
      // If auth status command fails, check credentials or custom token
      const credFile = join(home, '.claude', '.credentials.json');
      const hasCreds = existsSync(credFile);
      const hasLocalToken = settingsInfo && settingsInfo.data && settingsInfo.data.env && (settingsInfo.data.env.ANTHROPIC_AUTH_TOKEN || settingsInfo.data.env.ANTHROPIC_API_KEY);
      if (hasCreds || hasLocalToken) {
        authOk = true;
        authDetail = hasLocalToken ? 'Configured via environment/settings token' : 'Found ~/.claude/.credentials.json';
      } else {
        authDetail = 'Not authenticated. Run claude login or configure settings with NVIDIA API key (https://build.nvidia.com).';
      }
    }
    results.push({ name: 'Authentication Status', status: authOk ? 'PASS' : 'WARN', detail: authDetail });
  }

  // 5. Antigravity Environment
  let agyFound = false;
  let agyPath = '';
  try {
    const agyBin = platform() === 'win32' ? join(home, '.gemini', 'bin', 'agy.exe') : join(home, '.gemini', 'bin', 'agy');
    if (existsSync(agyBin)) {
      agyFound = true;
      agyPath = agyBin;
    } else {
      const checkCmd = platform() === 'win32' ? 'where.exe agy' : 'which agy';
      const out = execSync(checkCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (out) {
        agyFound = true;
        agyPath = out.split(/\r?\n/)[0];
      }
    }
  } catch {}

  if (agyFound) {
    results.push({ name: 'Antigravity CLI (agy)', status: 'PASS', detail: `Detected at ${agyPath}` });
  } else {
    results.push({ name: 'Antigravity CLI (agy)', status: 'INFO', detail: 'agy CLI not on PATH; Antigravity VS Code extension mode will be used.' });
  }

  // 6. VS Code IDE Lockfile
  const ideDir = join(home, '.claude', 'ide');
  let activeLocks = 0;
  if (existsSync(ideDir)) {
    try {
      activeLocks = readdirSync(ideDir).filter(f => f.endsWith('.lock')).length;
    } catch {}
  }
  if (activeLocks > 0) {
    results.push({ name: 'Claude VS Code Extension', status: 'PASS', detail: `Active IDE lockfile detected (${activeLocks} session server active)` });
  } else {
    results.push({ name: 'Claude VS Code Extension', status: 'INFO', detail: 'No active VS Code IDE lockfile detected (normal if VS Code Claude panel is closed)' });
  }

  // 7. Repository .gitignore Safeguards
  try {
    const added = ensureGitignoreSafeguards();
    if (added.length > 0) {
      results.push({ name: '.gitignore Safeguards', status: 'PASS', detail: `Auto-safeguarded (added ${added.join(', ')})` });
    } else {
      results.push({ name: '.gitignore Safeguards', status: 'PASS', detail: 'Protected (.claude/, .agents/tmp/, .claude-runs/, worktrees/ ignored)' });
    }
  } catch (err) {
    results.push({ name: '.gitignore Safeguards', status: 'WARN', detail: `Failed to verify .gitignore: ${err.message}` });
  }

  // Print results table
  for (const r of results) {
    const badge = r.status === 'PASS' ? '[PASS]' : (r.status === 'WARN' ? '[WARN]' : (r.status === 'FAIL' ? '[FAIL]' : '[INFO]'));
    console.log(`${badge.padEnd(8)} ${r.name.padEnd(28)} : ${r.detail}`);
  }

  console.log('\n------------------------------------------------------');
  const hasFail = results.some(r => r.status === 'FAIL');
  if (hasFail) {
    console.log('Action needed: Please resolve the [FAIL] item(s) above before running tasks.\n');
    process.exit(1);
  } else {
    console.log('Environment ready: All essential requirements satisfied.\n');
    process.exit(0);
  }
}

if (process.argv[1] && process.argv[1].endsWith('claude-doctor.mjs')) {
  runCheck();
}
