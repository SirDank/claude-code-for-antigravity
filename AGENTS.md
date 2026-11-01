# Free Claude Code Bridge for Antigravity

Operating instructions for Antigravity and Claude agents collaborating in this workspace.

## Core Capabilities
- **/claude**: The unified powerhouse command for all Claude Code operations. Supports modes:
  - `auto`: Fully autonomous task execution (`/claude <task>`).
  - `plan`: Read-only architecture planning and adversarial code reviews (`/claude plan <task>` or `/claude review <target>`).
  - `edit`: Multi-file code modifications inside an isolated Git worktree (`/claude edit <task>`).
  - `manual`: Step-by-step interactive guidance.
  - Automatically runs with maximum effort (`--effort max`), unlimited turns, connects to VS Code IDE via MCP, and routes through Free Claude Code (FCC) on port 8082 to NVIDIA Build.
  - **Repository Root Guarantee**: All executions automatically resolve and execute in the repository root (`git rev-parse --show-toplevel`).
  - **Session Continuity**: Automatically binds to the active Antigravity conversation (`ANTIGRAVITY_CONVERSATION_ID`), persisting memory, tool runs, and context across turns (`--session-id` on turn 1, auto `--resume` on subsequent turns).
  - **Live Window Visibility**: Supports `--window` / `--visible` to spawn a live visible terminal window with real-time execution and tools; window remains open on completion for user review.
  - **Subagent Support**: Spawns custom subagents (`--agents <json-or-file>`) with live reasoning/text streaming (`--forward-subagent-text`).
- **/claude-setup**: Runs `node scripts/claude-doctor.mjs` to check toolchain, binary detection, provider authentication, and `.gitignore` safeguards.

## Methodical Execution Workflow
When executing non-trivial features or refactorings:
1. **Discovery**: Read relevant files and references (`Read,Grep,Glob`).
2. **Plan**: Generate an architectural blueprint (`/claude plan <task>`).
3. **Isolate**: Execute code changes inside an isolated Git worktree (`/claude edit <task>`).
4. **Subagents**: Parallelize scans or specialized checks (`--agents`).
5. **Verify**: Run native project tests (`npm test`, `dart test`, etc.).
6. **Review**: Perform adversarial code review on changes (`/claude review <path>`).

## Operating Discipline
1. **Never edit files directly during delegation**: Subagent `claude-specialist` executes `node scripts/claude-runner.mjs`.
2. **Preserve context**: Never inject unfiltered multi-megabyte JSON outputs into conversation context; rely on the compact Honey Lever 3 digest.
3. **Session Continuity**: Let `claude-runner.mjs` automatically tie execution to `process.env.ANTIGRAVITY_CONVERSATION_ID` so subsequent tasks continue the same Claude conversation without context loss.
4. **Maximum Effort by Default**: Run with full reasoning effort (`--effort max`) so models (including free NVIDIA Build models like Nemotron 3 Ultra) reason at full depth.
5. **IDE & Visibility Integration**: Connects to the active VS Code instance via MCP for workspace context/diffs, supports `--window` / `--visible` to spawn a live visible terminal window (staying open after completion), `--verbose` for terminal logs, and default silent execution with Honey Lever 3 digest.
6. **Independent verification**: Always verify worktree implementations with real test runs (`npm test` or project equivalent) before applying diffs.
7. **Zero Workspace Pollution**: Run artifacts are safely isolated in the OS temporary directory (`tmpdir()/claude-runs/`), keeping workspace clean. The doctor and runner ensure `.claude/` and `worktrees/` are gitignored and worktrees pruned.
