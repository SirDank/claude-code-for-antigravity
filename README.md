# claude-code-for-antigravity

[![CI](https://github.com/SirDank/claude-code-for-antigravity/actions/workflows/ci.yml/badge.svg)](https://github.com/SirDank/claude-code-for-antigravity)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Antigravity](https://img.shields.io/badge/Antigravity-Plugin%20%26%20Skills-brightgreen)](https://antigravity.google)

A cross-platform bridge and skill suite enabling **Google Antigravity** (VS Code extension and `agy` CLI) to delegate tasks, run cross-model adversarial reviews, conduct test-gated worktree implementations, and hand off interactive sessions to **Claude Code**.

---

## Key Features

- **Unified `/claude` Powerhouse**: Consolidates task delegation, code review, architectural planning, and worktree isolation into a single intuitive slash command with native modes: `auto`, `plan`, `edit`, and `manual`.
- **Session Continuity per Conversation**: Automatically binds to the active Antigravity conversation (`ANTIGRAVITY_CONVERSATION_ID`), preserving conversational memory, tool executions, and file state across subsequent turns (`--session-id` on turn 1, auto `--resume` thereafter).
- **Live Window & Visibility Modes**: Supports `--window` / `--visible` to launch a visible console window showing real-time execution, reasoning, and tools; stays open on completion for user inspection. Supports `--headless` for silent background execution returning compact Honey Lever 3 digests.
- **Maximum Reasoning Effort**: Always defaults to `--effort max` (and Ultracode where supported) so free NVIDIA Build models (like `nvidia/nemotron-3-ultra-550b-a55b`) and premium models reason at full cognitive depth.
- **Unlimited Turns by Default**: Removes artificial turn caps so complex multi-file scans and large investigations run to natural completion without getting killed.
- **IDE & MCP Integration**: Auto-detects active VS Code instances (`~/.claude/ide/*.lock`), connects via the IDE MCP server for editor context and diffs, and transparently routes through the local zero-dependency proxy to NVIDIA Build.
- **Dedicated Doctor (`/claude-setup`)**: Standalone preflight diagnostic tool verifying 7 runtime requirements, authentication, provider settings, and automatic `.gitignore` safeguards.
- **Test-Gated Worktree Implementation (`/claude edit`)**: Quarantines code modifications in an isolated Git worktree (`--worktree`) with auto-cleanup (`git worktree prune`).
- **Zero Workspace Pollution**: Run artifacts are saved strictly in the OS temporary directory (`tmpdir()/claude-runs/`), keeping workspace git status clean.
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
                   /claude                    Terminal Execution
          (scripts/claude-runner.mjs)           (Interactive claude)
                      │                                 │
                      ├─────────────────────────────────┘
                      ▼
             ┌─────────────────┐
             │ Claude Code CLI │
             │  (Local Binary) │
             └────────┬────────┘
                      │
            ┌─────────┴──────────┐
            ▼                    ▼
 ┌──────────────────┐  ┌────────────────────────────────┐
 │ Native Anthropic │  │     scripts/nvidia-proxy.mjs   │
 │  (Claude Sonnet) │  │               │                │
 └──────────────────┘  │               ▼                │
                       │     NVIDIA Build NIM API       │
                       │ (e.g. Nemotron 3 Ultra 550B)   │
                       └────────────────────────────────┘
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

## Free NVIDIA Build Model Setup (Unlimited API Requests)

To save Antigravity quota and offload tasks to frontier-scale models for free without harsh daily limits, use **NVIDIA Build** (`build.nvidia.com`):

### Why NVIDIA Build over OpenRouter?
- **Unlimited Daily Requests**: Validating your account with a phone number (one-time OTP) unlocks **unlimited API requests without daily limits** (40 requests per minute rate limit, no 50-request daily cutoff like OpenRouter free tier).
- **1,000,000 (1M) Token Context Window**: Perfect for large codebase scans, multi-file investigations, and log audits.
- **Hosted on NVIDIA NIM Infrastructure**: Direct access to high-throughput Hopper/Blackwell GPU clusters.

### Model Intelligence Comparison (Artificial Analysis Benchmark)
According to the independent [Artificial Analysis Coding Agent Index](https://artificialanalysis.ai):
1. **`nvidia/nemotron-3-ultra-550b-a55b`** (**Score: ~49.3** - **Recommended #1**): 550B total / 55B active hybrid Mamba-MoE model. Highest coding benchmark score among open-weight models, purpose-built for agentic multi-turn reasoning.
2. **`mistralai/mistral-large-4-1t-a52b`** (**Score: ~48.3 - 48.8** - **Top Alternative**): Mistral's flagship 1-Trillion parameter MoE ("Le Chonk"). Exceptional token efficiency (uses ~47% fewer tokens than heavy CoT models) with top-tier software engineering intelligence.
3. **`z-ai/glm-5-3-flash`** & **`deepseek-ai/deepseek-v4.1-flash`**: Flash-tier efficiency models designed for speed, scoring lower on complex coding agent tasks (~32 - 45).

### How to Configure

1. Get your free API key at [build.nvidia.com](https://build.nvidia.com) (verify your phone number for unlimited access).
2. Configure via **Local Project Settings** (`.claude/settings.local.json`):
   ```json
   {
     "model": "nvidia/nemotron-3-ultra-550b-a55b",
     "env": {
       "ANTHROPIC_BASE_URL": "https://integrate.api.nvidia.com/v1",
       "ANTHROPIC_AUTH_TOKEN": "<your-nvidia-api-key>",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b"
     }
   }
   ```
   *Or* configure globally in your VS Code `settings.json`:
   ```json
   {
     "claudeCode.environmentVariables": [
       { "name": "ANTHROPIC_BASE_URL", "value": "https://integrate.api.nvidia.com/v1" },
       { "name": "ANTHROPIC_AUTH_TOKEN", "value": "<your-nvidia-api-key>" },
       { "name": "ANTHROPIC_API_KEY", "value": "" },
       { "name": "ANTHROPIC_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "ANTHROPIC_DEFAULT_SONNET_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "ANTHROPIC_DEFAULT_HAIKU_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "ANTHROPIC_DEFAULT_OPUS_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "CLAUDE_CODE_SUBAGENT_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" }
     ]
   }
   ```
3. The runner automatically detects either configuration and routes requests through NVIDIA Build!

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
