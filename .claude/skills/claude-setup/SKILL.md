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

## Doctor Checks Performed

The doctor verifies 7 preflight conditions:
1. **Node.js Runtime**: Node >= 18.0.0.
2. **Claude CLI Binary**: Path resolution via VS Code extension or PATH.
3. **Claude Settings & Provider**: OpenRouter or custom provider configuration.
4. **Authentication Status**: Credential file or environment token validity.
5. **Antigravity CLI**: Detection of `agy` executable or VS Code integration.
6. **Claude VS Code Extension**: Active session lockfile detection.
7. **.gitignore Safeguards**: Auto-appends `.claude/`, `.agents/tmp/`, `.claude-runs/`, and `worktrees/` if missing.

## Resolution Paths

### Claude CLI Missing
If `Claude CLI Binary` fails:
- **VS Code Extension**: Install the official `anthropic.claude-code` extension in VS Code. The runner auto-locates its bundled native binary.
- **Standalone CLI**: Run `npm install -g @anthropic-ai/claude-code`.
- **Manual Path**: Set `CLAUDE_PATH` in your shell environment pointing directly to the `claude` executable.

### Provider & Model Configuration (Save Antigravity Quota)
Configure top free OpenRouter models (such as `nvidia/nemotron-3-ultra-550b-a55b:free`) via either:

1. **Local Project Settings** (`.claude/settings.local.json`):
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
2. **VS Code Settings** (`settings.json`):
   ```json
   {
     "claudeCode.environmentVariables": {
       "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
       "ANTHROPIC_AUTH_TOKEN": "<your-openrouter-key>",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b:free"
     }
   }
   ```
3. Run `node ./scripts/claude-doctor.mjs` to confirm provider detection and gitignore safeguards.

