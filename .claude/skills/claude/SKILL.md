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
- **Maximum Reasoning Effort**: Always runs with `--effort max` (and Ultracode where available) to give free and paid models maximum thinking depth.
- **Unlimited Turns**: No arbitrary turn limits by default; runs to natural completion without premature termination.
- **Auto-Allowed Tools**: Pass `--allowedTools "*"` by default in non-interactive runs, preventing third-party MCP tool permissions from stalling execution.
- **IDE & Visibility Integration**: Auto-detects active VS Code IDE instances (`~/.claude/ide/*.lock`), connects to the IDE MCP server for editor awareness and diff viewing, and supports one-click prompt handoff to the VS Code Claude Code panel (`openVscodeUri`). For live visual TUI streaming, runs in VS Code integrated terminal sessions.

## Core Modes
Specify modes using `--mode <name>` or as the first word of your prompt:

| Mode | Equivalent CLI Flag | Behavior & Purpose |
|------|---------------------|--------------------|
| `auto` | `--permission-mode auto` | Fully autonomous task execution and problem solving (default). |
| `plan` | `--permission-mode plan` | Read-only architecture planning, requirements decomposition, or adversarial review. |
| `edit` | `--permission-mode acceptEdits` | Multi-file code modifications inside an isolated Git worktree (`--worktree`). |
| `manual` | `--permission-mode manual` | Interactive step-by-step guidance. |

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

## Options Reference
- `--mode <auto|plan|edit|manual>`: Execution mode and permission policy.
- `--effort <max|xhigh|high|medium|low>`: Reasoning effort (default: `max`).
- `--visible`: Force-focus Claude Code panel in VS Code.
- `--headless`: Force quiet background execution returning compact Honey Lever 3 digest.
- `--worktree`: Quarantine changes inside a clean Git worktree.
- `--tools <list>`: Explicit whitelist of built-in tools (e.g. `Read,Grep,Glob`).
- `--max-turns <n>`: Override unlimited turns with an explicit limit.

