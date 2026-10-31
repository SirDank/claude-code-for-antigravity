# Claude Code Bridge for Antigravity

Operating instructions for Antigravity and Claude agents collaborating in this workspace.

## Core Capabilities
- **/claude**: The unified powerhouse command for all Claude Code operations. Supports modes:
  - `auto`: Fully autonomous task execution (`/claude <task>`).
  - `plan`: Read-only architecture planning and adversarial code reviews (`/claude plan <task>` or `/claude review <target>`).
  - `edit`: Multi-file code modifications inside an isolated Git worktree (`/claude edit <task>`).
  - `manual`: Step-by-step interactive guidance.
  - Automatically runs with maximum effort (`--effort max`), unlimited turns, and auto-detects active VS Code Claude Code panel for live streaming.
- **/claude-setup**: Runs `node scripts/claude-doctor.mjs` to check toolchain, binary detection, provider authentication, and `.gitignore` safeguards.

## Operating Discipline
1. **Never edit files directly during delegation**: Subagent `claude-specialist` executes `node scripts/claude-runner.mjs`.
2. **Preserve context**: Never inject unfiltered multi-megabyte JSON outputs into conversation context; rely on the compact Honey Lever 3 digest.
3. **Maximum Effort by Default**: Run with full reasoning effort (`--effort max`) so models (including free OpenRouter models like Nemotron) reason at full depth.
4. **Live Visibility Cascade**: Automatically opens the VS Code Claude Code panel when VS Code is open, streams to terminal in interactive shells, and falls back to quiet background digest in subagents.
5. **Independent verification**: Always verify worktree implementations with real test runs (`npm test` or project equivalent) before applying diffs.
6. **Automatic Safeguards**: The doctor and runner ensure `.claude/`, `worktrees/`, `.claude-runs/`, and `.agents/tmp/` are gitignored and worktrees pruned.

