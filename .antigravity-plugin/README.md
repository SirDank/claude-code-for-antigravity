# Bridge for Claude Code

Integrate Anthropic's Claude Code CLI and VS Code extension into Google Antigravity.

## Capabilities
- **Preflight Doctor (`/claude-setup`)**: Diagnoses local environment, resolves Claude executable from PATH or VS Code extension, checks auth and OpenRouter settings.
- **Cross-Model Review (`/claude-review`)**: Runs adversarial code and architecture reviews against `git diff` using Claude Code, acting as an auditor gate.
- **Task Delegation (`/claude-delegate`)**: Offloads mundane or complex tasks to Claude Code, saving Antigravity context tokens via compact digests.
- **Autonomous Handoff (`/claude-handoff`)**: Executes tasks in an isolated Git worktree with verification checks before merging.
- **Desktop Continuity (`/claude-vscode`)**: Opens active sessions directly in the Claude Code VS Code sidebar panel.

