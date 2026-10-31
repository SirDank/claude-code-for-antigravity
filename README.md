# claude-code-for-antigravity

[![CI](https://github.com/SirDank/claude-code-for-antigravity/actions/workflows/ci.yml/badge.svg)](https://github.com/SirDank/claude-code-for-antigravity)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Antigravity](https://img.shields.io/badge/Antigravity-Plugin%20%26%20Skills-brightgreen)](https://antigravity.google)

A cross-platform bridge and skill suite enabling **Google Antigravity** (VS Code extension and `agy` CLI) to delegate tasks, run cross-model adversarial reviews, conduct test-gated worktree implementations, and hand off interactive sessions to **Claude Code**.

---

## Key Features

- **Antigravity Quota Conservation**: Offload repetitive, mundane, or low-intelligence tasks to Claude Code using top free OpenRouter models (such as `nvidia/nemotron-3-ultra-550b-a55b:free`), preserving Antigravity's high-reasoning quota for architecture and critical problems.
- **Quota-Saving Task Presets**: Built-in `--task [boilerplate|docs|scan|review]` shortcuts pre-configure the exact mode, tools, and turn limits for routine developer chores.
- **Live Visibility vs Headless Mode**: Use `--visible` to focus the Claude Code tab in VS Code and stream token generation live to your terminal, or keep the default `--headless` for compact background digest execution.
- **Multi-Stage Binary Discovery**: Automatically locates the Claude CLI binary from system `PATH`, VS Code extension caches (`anthropic.claude-code-*`), or custom `CLAUDE_PATH`.
- **Cross-Model Adversarial Review (`/claude-review`)**: Dispatches `git diff` reviews to Claude Code acting as an independent Critic / Auditor gate (implementing the Antigravity `/boost` and `/teamwork` review patterns).
- **Task Delegation (`/claude-delegate`)**: Offloads background research, root-cause debugging, or mundane tasks to Claude Code. Full raw transcripts are saved to disk, while a context-lean digest (<2,000 chars) is returned to Antigravity (Honey Lever 3).
- **Automatic Repository Safeguards**: Auto-verifies and safeguards `.gitignore` against accidental commits of `.claude/`, `.agents/tmp/`, `.claude-runs/`, and `worktrees/`, and auto-prunes dead git worktrees.
- **Test-Gated Worktree Implementation (`/claude-handoff`)**: Executes code modifications in an isolated Git worktree (`--worktree`) with independent Antigravity test verification before merging.
- **VS Code Graphical Handoff (`/claude-vscode`)**: Bridges sessions directly into the Claude Code VS Code chat panel via the `vscode://anthropic.claude-code/open` URI handler for interactive human diff reviews and `/plan` approval.
- **Cross-Platform & Zero Dependencies**: Built with pure Node.js (`.mjs`) for bulletproof execution on Windows, macOS, and Linux without shell hang issues or external npm packages.

---

## Architecture

```
                  ┌─────────────────────────────────────────┐
                  │       Google Antigravity Orchestrator   │
                  │   (VS Code Extension or "agy" CLI)      │
                  └────────────────────┬────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             /claude-review /claude-delegate     /claude-vscode
             (scripts/claude-runner.mjs)        (Desktop URI Handoff)
                      │                                 │
                      ├──────────────────────────┐      │
                      ▼                          ▼      ▼
             ┌─────────────────┐       ┌────────────────────────┐
             │ Claude Code CLI │       │ Claude Code Extension  │
             │   (claude -p)   │       │   (VS Code UI Panel)   │
             └────────┬────────┘       └────────────────────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
┌──────────────────┐  ┌────────────────────────────────┐
│ Native Anthropic │  │ OpenRouter / Custom Endpoints  │
│  (Claude Sonnet) │  │  (e.g. Nemotron 3 Ultra Free)  │
└──────────────────┘  └────────────────────────────────┘
```

---

## Quick Start

### 1. Run Preflight Diagnostics
Verify that your local environment, Claude binary, authentication, and provider settings are ready:
```bash
node scripts/claude-doctor.mjs
```
Or use the slash command inside Antigravity:
```text
/claude-setup
```

### 2. Offload Tasks & Save Antigravity Quota
Delegate routine or low-intelligence tasks to Claude Code using built-in presets:
```bash
# Generate repetitive boilerplate
node scripts/claude-runner.mjs --task boilerplate --prompt "Scaffold repository models"

# Sweeping documentation updates
node scripts/claude-runner.mjs --task docs --prompt "Add JSDoc comments to exports in src/"

# Wide repository inventory
node scripts/claude-runner.mjs --task scan --prompt "Map all route handlers and services"

# Watch live in VS Code tab and terminal stream
node scripts/claude-runner.mjs --task scan --prompt "Inspect codebase" --visible
```
Or use the slash command inside Antigravity:
```text
/claude-delegate Investigate the cause of connection timeouts in src/network.ts
```

### 3. Run Adversarial Review on Git Diff
Audit staged or unstaged changes before committing:
```text
/claude-review
```

### 4. Implement in Isolated Worktree
Safely isolate feature work in a dedicated worktree with test verification:
```text
/claude-handoff Implement user password reset flow with unit tests
```

### 5. Open in VS Code Sidebar
Hand off an active session directly to Claude Code's VS Code graphical chat panel:
```text
/claude-vscode
```

---

## Free OpenRouter / Budget Model Setup

To use Claude Code with free or budget models (such as Nemotron 3 Ultra via OpenRouter) and save Antigravity quota on mundane tasks:

1. Create a `.claude/settings.local.json` file in your repository:
   ```json
   {
     "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
     "env": {
       "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
       "ANTHROPIC_AUTH_TOKEN": "<your-openrouter-key>",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b:free"
     }
   }
   ```
   *Alternatively*, set it globally in your VS Code `settings.json`:
   ```json
   {
     "claudeCode.environmentVariables": {
       "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
       "ANTHROPIC_AUTH_TOKEN": "<your-openrouter-key>",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b:free"
     }
   }
   ```
2. The runner automatically detects either configuration and routes requests through OpenRouter!

---

## Installation

### Method A: Antigravity CLI Plugin
Install directly from GitHub into your global Antigravity environment:
```bash
agy plugin install https://github.com/SirDank/claude-code-for-antigravity
```

### Method B: Workspace Skill Bundle (VS Code Extension)
Clone or copy the skills into your workspace:
```bash
git clone https://github.com/SirDank/claude-code-for-antigravity.git .agents/plugins/bridge-claude-code
node .agents/plugins/bridge-claude-code/scripts/build-targets.mjs
```
Or add via `npx skills`:
```bash
npx skills add SirDank/claude-code-for-antigravity -a antigravity
```

---

## Testing & Quality Assurance

Run the automated test suite:
```bash
npm test
```

Run CI drift check across skill targets:
```bash
npm run check
```

---

## Disclaimers & License

- This project is dual-licensed under the [MIT License and Apache-2.0 License](LICENSE).
- **Non-Affiliation**: This is an independent open-source tool. It is not affiliated with or endorsed by Anthropic PBC or Google LLC.
