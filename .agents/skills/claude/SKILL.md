---
name: claude
description: Unified bridge to Claude Code. Execute autonomous tasks, run adversarial code reviews, plan architectures, and isolate edits in Git worktrees with VS Code IDE integration and maximum reasoning effort.
license: Apache-2.0
compatibility: node>=18.0.0
metadata:
  category: execution
  author: SirDank
---

# Unified Claude Code Bridge

Offload tasks, conduct cross-model adversarial reviews, plan system architectures, and execute isolated code implementations using Claude Code (`claude -p`).

## Key Principles & Execution Discipline
- **Repository Root Guarantee**: All executions resolve and execute strictly in the repository root (`git rev-parse --show-toplevel`), preventing directory drift or path confusion across shells and subdirectories.
- **Session Continuity**: Automatically binds to the active Antigravity conversation (`ANTIGRAVITY_CONVERSATION_ID`), persisting conversational memory, tool executions, and file state across multiple turns (`--session-id` on turn 1, auto `--resume` on subsequent turns).
- **On-Demand Free Claude Code (FCC) Routing**: Transparently routes requests to the local Free Claude Code router (`http://127.0.0.1:8082`), auto-spawning `fcc-server` on demand if not already listening.
- **Maximum Reasoning Effort**: Always runs with `--effort max` (and Ultracode where available) to give free and paid models maximum thinking depth.
- **Subagent Support & Orchestration**: Natively supports spawning specialized Claude Code subagents via `--agents <json-or-file>` with real-time thinking/text forwarding (`--forward-subagent-text`).
- **Unlimited Turns**: No arbitrary turn limits by default; runs to natural completion without premature termination.
- **Live Window & Headless Modes**: Supports `--window` / `--visible` to spawn a live visible console window displaying streaming tools and diffs (remaining open for review), or `--headless` for silent background execution with Honey digests.
- **Auto-Allowed Tools**: Passes `--allowedTools "*"` by default in non-interactive runs, preventing third-party MCP tool permissions from stalling execution.
- **IDE Integration & Protocol Bridge**: Auto-detects active VS Code IDE instances (`~/.claude/ide/*.lock`), connects to the IDE MCP server for editor context and diffs.
- **Zero Workspace Pollution**: Temporary execution artifacts are placed in the OS temp directory (`tmpdir()/claude-runs/`), ensuring no junk files appear in the repository.

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

1. **Phase 1: Discovery** — Inspect affected files, module boundaries, and dependencies using read-only tools (`Read`, `Grep`, `Glob`) or `scan` preset.
2. **Phase 2: Architectural Plan** — Run `plan` mode to synthesize a clean implementation plan before altering any files.
3. **Phase 3: Worktree Isolation** — Execute changes in `edit` mode (`--worktree`), ensuring working tree remains safe from regressions.
4. **Phase 4: Subagent Orchestration** — Leverage Claude Code custom agents (`--agents`) and `--forward-subagent-text` to parallelize investigations without context saturation.
5. **Phase 5: Verification** — Independently verify changes with the project's native build and test runners (`npm test`, `dart test`, `cargo test`, etc.).
6. **Phase 6: Adversarial Review** — Run `review` mode across modified files to catch missed edge cases, security holes, and code bloat.

## Core Modes
Specify modes using `--mode <name>` or as the first word of your prompt:

| Mode | Equivalent CLI Flag | Behavior & Purpose |
|------|---------------------|--------------------|
| `auto` | `--permission-mode auto` | Fully autonomous task execution and problem solving (default). |
| `plan` | `--permission-mode plan` | Read-only architecture planning, requirements decomposition, or adversarial review. |
| `edit` | `--permission-mode acceptEdits` | Multi-file code modifications inside an isolated Git worktree (`--worktree`). |
| `manual` | `--permission-mode manual` | Interactive step-by-step guidance. |

## Built-in Claude Code CLI Commands
Claude Code provides built-in slash commands accessible during interactive and live window sessions:

- `/init`: Scaffolds a new project `CLAUDE.md` memory guide with detected conventions.
- `/compact`: Manually triggers context compaction to reclaim token headroom.
- `/cost`: Displays real-time token usage and monetary cost breakdown for the current session.
- `/doctor`: Runs Claude Code internal health checks on network, API, and MCP connectivity.
- `/mcp`: Inspects, toggles, or reloads active Model Context Protocol (MCP) servers.
- `/memory`: Inspects and edits persistent memories saved across project sessions.

## Usage Examples

### 1. General Task Delegation
```bash
node ./scripts/claude-runner.mjs "Scan lib/src/services and list all TODO comments"
```
Or inside Antigravity:
```text
/claude Scan lib/src/services and list all TODO comments
```

### 2. Adversarial Code Review (`plan` mode)
Audit uncommitted changes or specific files for edge cases and cross-platform bugs:
```bash
node ./scripts/claude-runner.mjs review lib/src/utils/platform_utils.dart
```
Or inside Antigravity:
```text
/claude review lib/src/utils/platform_utils.dart
```

### 3. Architecture & System Planning (`plan` mode)
Formulate structured implementation plans before modifying code:
```bash
node ./scripts/claude-runner.mjs plan "Design decoupled caching layer for database service"
```
Or inside Antigravity:
```text
/claude plan Design decoupled caching layer for database service
```

### 4. Isolated Worktree Implementation (`edit` mode)
Safely quarantine code modifications in a temporary Git worktree with automatic pruning on completion:
```bash
node ./scripts/claude-runner.mjs edit "Implement user authentication controller and unit tests"
```
Or inside Antigravity:
```text
/claude edit Implement user authentication controller and unit tests
```

### 5. Subagent Delegation with Live Text Forwarding
Pass custom subagents and stream intermediate reasoning back:
```bash
node ./scripts/claude-runner.mjs --agents subagents.json --forward-subagent-text "Run parallel security audit across all API endpoints"
```

## Options Reference
- `--mode <auto|plan|edit|manual>`: Execution mode and permission policy.
- `--effort <max|xhigh|high|medium|low>`: Reasoning effort (default: `max`).
- `--window`, `--visible`: Spawns a visible external terminal window to watch execution live in real time (remains open for user review).
- `--verbose`: Streams live CLI logs to stdout in current terminal.
- `--headless`: Force quiet background execution returning compact Honey Lever 3 digest.
- `--session-id <uuid>`: Manually specify session identifier (defaults to active Antigravity conversation ID).
- `--resume <uuid>`: Resume a specific prior conversation session.
- `--worktree`: Quarantine changes inside a clean Git worktree.
- `--tools <list>`: Explicit whitelist of built-in tools (e.g. `Read,Grep,Glob`).
- `--allowedTools <list>`: Whitelist for automatic tool approval (defaults to `*`).
- `--agents <json-or-file>`: Configure custom subagents for Claude Code.
- `--forward-subagent-text`: Stream subagent text and reasoning output in real-time.
- `--autocompact <tokens>`: Configure automatic context compaction threshold.
- `--cwd <path>`: Override working directory (defaults to Git repo root).
- `--max-turns <n>`: Override unlimited turns with an explicit limit.
