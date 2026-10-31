# claude-code-for-antigravity

[![CI](https://github.com/SirDank/claude-code-for-antigravity/actions/workflows/ci.yml/badge.svg)](https://github.com/SirDank/claude-code-for-antigravity)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Antigravity](https://img.shields.io/badge/Antigravity-Plugin%20%26%20Skills-brightgreen)](https://antigravity.google)

A cross-platform bridge and skill suite enabling **Google Antigravity** (VS Code extension and `agy` CLI) to delegate tasks, run cross-model adversarial reviews, conduct test-gated worktree implementations, and hand off interactive sessions to **Claude Code**.

---

## Key Features

- **Unified `/claude` Powerhouse**: Consolidates task delegation, code review, architectural planning, and worktree isolation into a single intuitive slash command with native modes: `auto`, `plan`, `edit`, and `manual`.
- **Maximum Reasoning Effort**: Always defaults to `--effort max` (and Ultracode where supported) so free OpenRouter models (like `nvidia/nemotron-3-ultra-550b-a55b:free`) and premium models reason at full cognitive depth.
- **Unlimited Turns by Default**: Removes artificial turn caps so complex multi-file scans and large investigations run to natural completion without getting killed.
- **IDE Integration & Live Visibility**: Auto-detects active Claude Code instances in VS Code (`~/.claude/ide/*.lock`), connects via the IDE MCP server for editor context and diffs, and supports one-click prompt handoff to the Claude Code panel (`openVscodeUri`). For live visual TUI streaming, runs in VS Code integrated terminal sessions.
- **Dedicated Doctor (`/claude-setup`)**: Standalone preflight diagnostic tool verifying 7 runtime requirements, authentication, provider settings, and automatic `.gitignore` safeguards.
- **Test-Gated Worktree Implementation (`/claude edit`)**: Quarantines code modifications in an isolated Git worktree (`--worktree`) with auto-cleanup (`git worktree prune`).
- **Cross-Platform & Zero Dependencies**: Built with pure Node.js (`.mjs`) for bulletproof execution on Windows, macOS, and Linux without external npm packages.

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
                   /claude                        openVscodeUri
          (scripts/claude-runner.mjs)         (Desktop URI Handoff)
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

### 1. Run Preflight Diagnostics (`/claude-setup`)
Verify that your local environment, Claude binary, authentication, provider settings, and gitignore safeguards are ready:
```bash
node scripts/claude-doctor.mjs
```
Or inside Antigravity:
```text
/claude-setup
```

### 2. Autonomous Task Execution (`/claude`)
Delegate tasks with maximum reasoning effort (`--effort max`) and unlimited turns:
```bash
node scripts/claude-runner.mjs "Scan lib/src/services and list all TODO comments"
```
Or inside Antigravity:
```text
/claude Scan lib/src/services and list all TODO comments
```

### 3. Adversarial Code Review (`/claude review` / `plan` mode)
Audit staged or unstaged changes or specific files for edge cases and cross-platform bugs:
```bash
node scripts/claude-runner.mjs review lib/src/utils/platform_utils.dart
```
Or inside Antigravity:
```text
/claude review lib/src/utils/platform_utils.dart
```

### 4. System Architecture & Planning (`/claude plan`)
Formulate detailed plans before modifying code:
```bash
node scripts/claude-runner.mjs plan "Design caching architecture for database service"
```
Or inside Antigravity:
```text
/claude plan Design caching architecture for database service
```

### 5. Isolated Worktree Implementation (`/claude edit` / `edit` mode)
Safely quarantine multi-file code modifications in a temporary Git worktree:
```bash
node scripts/claude-runner.mjs edit "Implement user authentication controller and unit tests"
```
Or inside Antigravity:
```text
/claude edit Implement user authentication controller and unit tests
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
