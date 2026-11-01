# Bridge for Claude Code

Integrate Anthropic's Claude Code CLI and VS Code extension into Google Antigravity.

## Capabilities
- **Unified Claude Bridge (`/claude`)**: Offload tasks, conduct adversarial code reviews, plan architectures, and execute isolated Git worktree edits using Claude Code (`claude -p`).
- **Repository Root Guarantee**: Guarantees Claude Code executes strictly in the Git repository root, eliminating directory drift across child shells.
- **Session Continuity**: Preserves conversation memory across turns by automatically binding to the active Antigravity conversation.
- **Free Claude Code (FCC) On-Demand Routing**: Auto-routes through local FCC server on port 8082 to translate requests to NVIDIA Build NIM APIs (`nvidia/nemotron-3-ultra-550b-a55b`).
- **Subagent Support & Live Streaming**: Pass custom subagents (`--agents`) and stream reasoning output in real-time (`--forward-subagent-text`).
- **Live Window & Visibility**: Supports `--window` to watch live execution in an external console window (remains open for review), or `--headless` for background execution.
- **Preflight Doctor (`/claude-setup`)**: Diagnoses local environment, resolves Claude executable from PATH or VS Code extension, checks auth and FCC / NVIDIA Build provider settings.
- **Zero Workspace Pollution**: Run artifacts are stored in OS temp directory, keeping repository clean.
- **Compact Digest Returns**: Enforces strict Honey Lever 3 output bounds (<2,000 characters) to prevent token pollution.
