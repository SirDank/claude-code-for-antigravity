# Claude Code Bridge for Antigravity

Operating instructions for Antigravity and Claude agents collaborating in this workspace.

## Core Capabilities
- **/claude-setup**: Runs `node scripts/claude-doctor.mjs` to check toolchain, binary detection, authentication, and `.gitignore` safeguards.
- **/claude-delegate**: Offloads tasks to Claude Code (`claude -p`). Presets include `--task [boilerplate|docs|scan|review]`. Transcripts saved to `.agents/tmp/claude-runs/<session_id>.json`; compact (<2,000 char) digest returned to context.
- **/claude-review**: Dispatches an adversarial cross-model auditor check on `git diff` or implementation plans using Claude Code.
- **/claude-handoff**: Executes code modifications in an isolated Git worktree (`--worktree`) with independent verification and auto-cleanup (`git worktree prune`).
- **/claude-vscode**: Bridges the active session into the Claude Code VS Code sidebar panel via `vscode://anthropic.claude-code/open` (`--visible`).

## Operating Discipline
1. **Never edit files directly during delegation**: Subagent `claude-specialist` executes `node scripts/claude-runner.mjs`.
2. **Preserve context**: Never inject unfiltered multi-megabyte JSON outputs into conversation context; rely on the digest contract.
3. **OpenRouter / Free Models (Save Antigravity Quota)**: When `.claude/settings.local.json` or VS Code `settings.json` is configured with OpenRouter endpoints (e.g. `nvidia/nemotron-3-ultra-550b-a55b:free`), delegate repetitive or mundane tasks (boilerplate, docstrings, repository scans, diff reviews) to Claude Code to save Antigravity quota.
4. **Live Visibility**: Pass `--visible` when the user wants to watch Claude Code execute live in the VS Code tab and terminal stream; use `--headless` (default) for silent subagent background execution.
5. **Independent verification**: Always verify worktree implementations with real test runs (`npm test` or project equivalent) before applying diffs.
6. **Automatic Safeguards**: The doctor and runner ensure `.claude/`, `worktrees/`, `.claude-runs/`, and `.agents/tmp/` are gitignored and worktrees pruned.

