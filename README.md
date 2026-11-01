# claude-code-for-antigravity

[![CI](https://github.com/SirDank/claude-code-for-antigravity/actions/workflows/ci.yml/badge.svg)](https://github.com/SirDank/claude-code-for-antigravity)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Antigravity](https://img.shields.io/badge/Antigravity-Plugin%20%26%20Skills-brightgreen)](https://antigravity.google)

A cross-platform bridge and skill suite enabling **Google Antigravity** (VS Code extension and `agy` CLI) to delegate tasks, run cross-model adversarial reviews, conduct test-gated worktree implementations, coordinate subagents, and hand off interactive sessions to **Claude Code**.

---

## Key Features

- **Unified `/claude` Powerhouse**: Consolidates task delegation, code review, architectural planning, and worktree isolation into a single intuitive slash command with native modes: `auto`, `plan`, `edit`, and `manual`.
- **Repository Root Guarantee**: All Claude Code commands and terminal sessions resolve and execute strictly in the repository root (`git rev-parse --show-toplevel`), preventing directory drift or path confusion across shells and subdirectories.
- **Session Continuity per Conversation**: Automatically binds to the active Antigravity conversation (`ANTIGRAVITY_CONVERSATION_ID`), preserving conversational memory, tool executions, and file state across subsequent turns (`--session-id` on turn 1, auto `--resume` thereafter).
- **Free Claude Code (FCC) Router Integration**: Routes requests transparently to the local Free Claude Code router (`http://127.0.0.1:8082`), translating Anthropic API messages to NVIDIA Build NIM (or 61+ other providers) and auto-spawning `fcc-server` on demand.
- **Subagent Support & Orchestration**: Natively passes custom subagents (`--agents <json-or-file>`) with live text and reasoning streaming (`--forward-subagent-text`), powered by `CLAUDE_CODE_SUBAGENT_MODEL`.
- **Live Window & Visibility Modes**: Supports `--window` / `--visible` to launch a visible console window showing real-time execution, reasoning, and tools; stays open on completion for user inspection. Supports `--headless` for silent background execution returning compact Honey Lever 3 digests.
- **Maximum Reasoning Effort**: Always defaults to `--effort max` (and Ultracode where supported) so free NVIDIA Build models (like `nvidia/nemotron-3-ultra-550b-a55b`) and premium models reason at full cognitive depth.
- **Unlimited Turns by Default**: Removes artificial turn caps so complex multi-file scans and large investigations run to natural completion without getting killed.
- **IDE & MCP Integration**: Auto-detects active VS Code instances (`~/.claude/ide/*.lock`), connects via the IDE MCP server for editor context and diffs.
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
 ┌──────────────────┐  ┌────────────────────────────────────┐
 │ Native Anthropic │  │    Free Claude Code Router (FCC)   │
 │  (Claude Sonnet) │  │       (http://127.0.0.1:8082)      │
 └──────────────────┘  │                 │                  │
                       │                 ▼                  │
                       │        NVIDIA Build NIM API        │
                       │    (e.g. Nemotron 3 Ultra 550B)    │
                       └────────────────────────────────────┘
```

---

## Methodical Execution Workflow

For multi-step, complex, or security-sensitive engineering tasks, follow this structured execution pipeline:

```
┌────────────────────────────────────────────────────────┐
│ 1. Discovery Phase                                     │
│    Inspect affected paths & boundaries (Read/Grep/Glob)│
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Architectural Plan Phase                            │
│    Decompose into discrete, testable sub-goals (/plan) │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Worktree Isolation Phase                            │
│    Quarantine edits in isolated branch (/claude edit)  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Subagent Orchestration Phase                        │
│    Delegate parallel scans or specialized checks       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. Verification Phase                                  │
│    Execute project test suite (npm test, dart test)    │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 6. Adversarial Review Phase                            │
│    Audit diffs for edge cases & bloat (/claude review) │
└────────────────────────────────────────────────────────┘
```

1. **Discovery Phase**: Inspect code locations and references with read-only tools (`Read,Grep,Glob`) or preset `scan`.
2. **Architectural Plan Phase**: Formulate an implementation strategy using `plan` mode before touching any files.
3. **Worktree Isolation Phase**: Execute changes in an isolated Git worktree via `edit` mode (`--worktree`).
4. **Subagent Orchestration Phase**: Spawn custom agents (`--agents`) and stream subagent output (`--forward-subagent-text`) to divide work without bloating the main context.
5. **Verification Phase**: Run project test suites (`npm test`, `dart test`, etc.) to independently ensure tests pass.
6. **Adversarial Review Phase**: Run `review` mode on the resulting diff to spot regressions, edge cases, and bloat.

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

### 6. Subagent Delegation with Live Text Forwarding
Pass custom subagents and stream intermediate reasoning back:
```bash
node scripts/claude-runner.mjs --agents subagents.json --forward-subagent-text "Run parallel security audit across all API endpoints"
```

---

## Free NVIDIA Build Model Setup via Free Claude Code (FCC)

To save Antigravity quota and offload tasks to frontier-scale models for free without harsh daily limits, route through **Free Claude Code (FCC)** backed by **NVIDIA Build** (`build.nvidia.com`):

### Why NVIDIA Build & Free Claude Code?
- **Unlimited Daily Requests**: Validating your NVIDIA Build account with a phone number (one-time OTP) unlocks **unlimited API requests without daily limits** (40 requests per minute rate limit, no 50-request daily cutoff like OpenRouter free tier).
- **1,000,000 (1M) Token Context Window**: Perfect for large codebase scans, multi-file investigations, and log audits.
- **Free Claude Code Architecture**: FastAPI translation layer on `http://127.0.0.1:8082` that translates Anthropic messages, handles token headroom, and auto-spawns on demand via `scripts/claude-runner.mjs`.

### Model Intelligence Comparison (Artificial Analysis Benchmark)
According to the independent [Artificial Analysis Coding Agent Index](https://artificialanalysis.ai):
1. **`nvidia/nemotron-3-ultra-550b-a55b`** (**Score: ~49.3** - **Recommended #1**): 550B total / 55B active hybrid Mamba-MoE model. Highest coding benchmark score among open-weight models, purpose-built for agentic multi-turn reasoning.
2. **`mistralai/mistral-large-4-1t-a52b`** (**Score: ~48.3 - 48.8** - **Top Alternative**): Mistral's flagship 1-Trillion parameter MoE ("Le Chonk"). Exceptional token efficiency (uses ~47% fewer tokens than heavy CoT models) with top-tier software engineering intelligence.

### How to Configure

1. Install Free Claude Code:
   ```bash
   uv tool install free-claude-code
   ```
2. Get your free API key at [build.nvidia.com](https://build.nvidia.com).
3. Configure `~/.claude/settings.json`:
   ```json
   {
     "env": {
       "ANTHROPIC_BASE_URL": "http://127.0.0.1:8082",
       "ANTHROPIC_AUTH_TOKEN": "freecc",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "ANTHROPIC_DEFAULT_SONNET_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "ANTHROPIC_DEFAULT_HAIKU_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "ANTHROPIC_DEFAULT_OPUS_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "CLAUDE_CODE_SUBAGENT_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]"
     }
   }
   ```
4. `claude-runner.mjs` automatically detects this endpoint and auto-starts `fcc-server` on demand if not already running.

---

## Built-in Claude Code CLI Commands

During interactive and live window sessions, Claude Code provides native commands:
- `/init`: Scaffolds a project `CLAUDE.md` guide with project guidelines and commands.
- `/compact`: Triggers context compaction to reduce active token memory.
- `/cost`: Inspects token counts and total session cost.
- `/doctor`: Verifies local health and connectivity.
- `/mcp`: Manages Model Context Protocol servers.
- `/memory`: Reads and modifies persistent project memories.

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
