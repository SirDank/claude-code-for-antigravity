# Claude Code Bridge for Antigravity

Operating instructions for Antigravity and Claude agents collaborating in this workspace.

## Core Capabilities
- **/claude-setup**: Runs `node scripts/claude-doctor.mjs` to check toolchain, binary detection, and authentication status.
- **/claude-delegate**: Offloads tasks to Claude Code (`claude -p`). Full run transcripts are saved to `.agents/tmp/claude-runs/<session_id>.json`; a compact (<2,000 char) digest is returned to context.
- **/claude-review**: Dispatches an adversarial cross-model auditor check on `git diff` or implementation plans using Claude Code.
- **/claude-handoff**: Executes code modifications in an isolated Git worktree (`--worktree`) with independent verification before merging.
- **/claude-vscode**: Bridges the active session into the Claude Code VS Code sidebar panel via `vscode://anthropic.claude-code/open`.

## Operating Discipline
1. **Never edit files directly during delegation**: Subagent `claude-specialist` executes `node scripts/claude-runner.mjs`.
2. **Preserve context**: Never inject unfiltered multi-megabyte JSON outputs into conversation context; rely on the digest contract.
3. **OpenRouter / Free Models**: If `.claude/settings.local.json` is configured with OpenRouter endpoints (e.g. `nvidia/nemotron-3-ultra-550b-a55b:free`), delegate repetitive or mundane tasks to Claude Code to save Antigravity quota.
4. **Independent verification**: Always verify worktree implementations with real test runs (`npm test` or project equivalent) before applying diffs.

