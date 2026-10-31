# Security Policy

## Credential Protection & Isolation
- **No Token Intermediation**: `claude-code-for-antigravity` does not collect, log, scrape, or transmit Claude credentials, session tokens, or API keys.
- **Credential Storage**: User credentials remain managed exclusively by the official Claude Code binary in `~/.claude/.credentials.json` or by local workspace environment files (`.claude/settings.local.json`).
- **Deny Rule**: Antigravity agents are denied direct read access to `~/.claude/.credentials.json` by permission policy (`Deny > Ask > Allow`).

## Sandboxing & Isolation
- **Read-Only Scopes**: Delegation tasks defaults to `--mode read` with `--tools "Read,Grep,Glob"` and `--permission-mode dontAsk`.
- **Worktree Quarantine**: Write tasks default to isolated Git worktrees (`--worktree`), ensuring file modifications cannot corrupt the primary workspace branch until independently verified.
- **Hook Guard**: The `PreToolUse` hook blocks accidental invocation of `--dangerously-skip-permissions` unless `ALLOW_DANGEROUS_PERMISSIONS=1` is explicitly set in the execution environment.

## Reporting Vulnerabilities
If you discover a security vulnerability within this repository, please report it via GitHub Private Vulnerability Reporting or contact the repository maintainer directly.

