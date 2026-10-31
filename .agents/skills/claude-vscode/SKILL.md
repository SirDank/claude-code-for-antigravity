---
name: claude-vscode
description: Hand off tasks or active sessions directly to the Claude Code VS Code sidebar panel for human-in-the-loop review and interactive planning. Use when visual diff inspection or interactive plan approval is desired.
license: Apache-2.0
compatibility: node>=18.0.0
metadata:
  category: handoff
  author: SirDank
---

# VS Code Interactive Handoff

Bridges Antigravity sessions into the Claude Code VS Code graphical chat panel.

## When to Use
- You want the user to review interactive proposed diffs directly in the VS Code editor with hunk accept/reject buttons.
- You want to edit Claude Code `/plan` documents in VS Code.
- Seamlessly handing off from autonomous background runs to interactive developer chat.

## Protocol

Uses the official Claude Code VS Code extension URI handler:
`vscode://anthropic.claude-code/open?session=<sessionId>&prompt=<encodedPrompt>`

### 1. Launch Direct Session in VS Code Panel
```bash
node ./scripts/claude-runner.mjs \
  --prompt "Refactor database query logic in repository" \
  --open-vscode
```

### 2. Manual URI Handoff
From terminal or script:
- **Windows**:
  ```powershell
  Start-Process "vscode://anthropic.claude-code/open?prompt=Review%20changes"
  ```
- **macOS**:
  ```bash
  open "vscode://anthropic.claude-code/open?prompt=Review%20changes"
  ```
- **Linux**:
  ```bash
  xdg-open "vscode://anthropic.claude-code/open?prompt=Review%20changes"
  ```

