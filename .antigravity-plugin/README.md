# Bridge for Claude Code

Integrate Anthropic's Claude Code CLI and VS Code extension into Google Antigravity.

## Capabilities
- **Unified Claude Bridge (`/claude`)**: Offload tasks, conduct adversarial code reviews, plan architectures, and execute isolated Git worktree edits using Claude Code (`claude -p`).
- **Preflight Doctor (`/claude-setup`)**: Diagnoses local environment, resolves Claude executable from PATH or VS Code extension, checks auth and NVIDIA Build provider settings.
- **Quota Saver via NVIDIA Build**: Preserves Antigravity tokens by routing tasks through NVIDIA Build NIM APIs (`nvidia/nemotron-3-ultra-550b-a55b`).
- **Compact Digest Returns**: Enforces strict Honey Lever 3 output bounds (<2,000 characters) to prevent token pollution.

