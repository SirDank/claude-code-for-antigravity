# Installation Guide

`claude-code-for-antigravity` supports both the Antigravity VS Code extension and the standalone `agy` CLI across Windows, macOS, and Linux.

## Requirements
- **Node.js**: v18.0.0 or higher.
- **Claude Code**: Either installed globally via `npm install -g @anthropic-ai/claude-code` OR the official VS Code extension (`anthropic.claude-code`).
- **Google Antigravity**: Either the VS Code extension (`Google.google-antigravity`) or Antigravity CLI (`agy`).

---

## Installation Matrix

| Host Environment | Preferred Installation Method | Command / Action |
| :--- | :--- | :--- |
| **Antigravity CLI (`agy`)** | Antigravity Plugin Install | `agy plugin install https://github.com/SirDank/claude-code-for-antigravity` |
| **Antigravity VS Code Extension** | Workspace Customization | Copy repository skills to `.agents/skills/` OR run `npx skills add SirDank/claude-code-for-antigravity -a antigravity` |
| **Claude Code CLI** | Companion Plugin | `claude plugin install https://github.com/SirDank/claude-code-for-antigravity` |

---

## Sandbox & Permissions Setup

Add the following permissions snippet to your Antigravity settings (`~/.gemini/antigravity-cli/settings.json` or VS Code Agent Settings) to allow sandboxed runner execution without prompting repeatedly:

```json
{
  "permissions": {
    "allow": [
      "command(node ./scripts/claude-runner.mjs)",
      "command(node ./scripts/claude-doctor.mjs)",
      "read_url(api.anthropic.com)",
      "read_file(~/.claude)",
      "write_file(~/.claude)"
    ],
    "deny": [
      "read_file(~/.claude/.credentials.json)"
    ]
  }
}
```

> [!NOTE]
> The `deny` rule for `~/.claude/.credentials.json` protects user tokens from being read directly by the LLM agent, while still allowing the native `claude` child process to authenticate normally.

---

## Agent Quick-Install Prompt

If instructing an AI agent to install this bridge in an existing workspace, paste this prompt:

```text
Please install claude-code-for-antigravity into this repository:
1. Clone or download https://github.com/SirDank/claude-code-for-antigravity into .agents/plugins/bridge-claude-code (or copy its skills/ into .agents/skills/).
2. Run `node .agents/plugins/bridge-claude-code/scripts/claude-doctor.mjs` to verify binary detection and authentication.
3. Test with `/claude-setup`.
```

