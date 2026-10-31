---
name: claude-setup
description: Diagnose local Claude Code CLI installation, binary path, authentication status, provider configurations (including OpenRouter models), and Antigravity integration readiness. Use when verifying Claude Code availability, setting up the bridge, or troubleshooting execution errors.
license: Apache-2.0
compatibility: node>=18.0.0
metadata:
  category: diagnostics
  author: SirDank
---

# Claude Code Setup & Doctor

Runs preflight verification for Claude Code integration within Google Antigravity.

## When to Use
- Verifying whether Claude Code CLI is available on `PATH` or bundled in VS Code.
- Checking authentication status and OpenRouter / custom provider settings.
- Troubleshooting permissions or sandbox restrictions in Antigravity.
- Diagnosing active VS Code extension lockfiles.

## Procedure

1. Execute the doctor script:
   ```bash
   node ./scripts/claude-doctor.mjs
   ```

2. Review output statuses:
   - **`[PASS]`**: Ready for execution.
   - **`[WARN]`**: Functional with caveats (e.g. relying on fallback authentication).
   - **`[FAIL]`**: Blocking issue. Follow printed instructions.

## Resolution Paths

### Claude CLI Missing
If `Claude CLI Binary` fails:
- **VS Code Extension**: Install the official `anthropic.claude-code` extension in VS Code. The runner auto-locates its bundled native binary.
- **Standalone CLI**: Run `npm install -g @anthropic-ai/claude-code`.
- **Manual Path**: Set `CLAUDE_PATH` in your shell environment pointing directly to the `claude` executable.

### Provider & Model Configuration
To use free or budget models (e.g. OpenRouter Nemotron) without Antigravity token burn:
1. Place a `.claude/settings.local.json` file in your workspace:
   ```json
   {
     "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
     "env": {
       "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
       "ANTHROPIC_AUTH_TOKEN": "<your-openrouter-key>",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b:free"
     }
   }
   ```
2. Re-run `node ./scripts/claude-doctor.mjs` to confirm the provider is detected.

