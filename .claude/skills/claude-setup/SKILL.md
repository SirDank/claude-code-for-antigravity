---
name: claude-setup
description: Diagnose local Claude Code CLI installation, binary path, authentication status, provider configurations (including NVIDIA Build models), and Antigravity integration readiness. Use when verifying Claude Code availability, setting up the bridge, or troubleshooting execution errors.
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
- Checking authentication status and NVIDIA Build / custom provider settings.
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
3. **Claude Settings & Provider**: NVIDIA Build or custom provider configuration.
4. **Authentication Status**: Credential file or environment token validity.
5. **Antigravity CLI**: Detection of `agy` executable or VS Code integration.
6. **Claude VS Code Extension**: Active session lockfile detection.
7. **.gitignore Safeguards**: Auto-appends `.claude/*`, `!.claude/skills/`, `.claude-runs/`, and `worktrees/` if missing.

## Resolution Paths

### Claude CLI Missing
If `Claude CLI Binary` fails:
- **VS Code Extension**: Install the official `anthropic.claude-code` extension in VS Code. The runner auto-locates its bundled native binary.
- **Standalone CLI**: Run `npm install -g @anthropic-ai/claude-code`.
- **Manual Path**: Set `CLAUDE_PATH` in your shell environment pointing directly to the `claude` executable.

### Recommended Provider & Model: NVIDIA Build (Free & Unlimited API Requests)
NVIDIA Build provides free access to frontier-scale models with phone verification (OTP), granting unlimited requests without daily quota cliff (40 RPM limit):
- **Model**: `nvidia/nemotron-3-ultra-550b-a55b` (#1 on Artificial Analysis Coding Agent Index, 550B hybrid Mamba-MoE with 1M context).
- **Alternative**: `mistralai/mistral-large-4-1t-a52b` ("Le Chonk", 1T parameter MoE).

Configure via either:

1. **Local Project Settings** (`.claude/settings.local.json`):
   ```json
   {
     "model": "nvidia/nemotron-3-ultra-550b-a55b",
     "env": {
       "ANTHROPIC_BASE_URL": "https://integrate.api.nvidia.com/v1",
       "ANTHROPIC_AUTH_TOKEN": "<your-nvidia-api-key>",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b"
     }
   }
   ```
2. **VS Code User Settings** (`settings.json`):
   ```json
   {
     "claudeCode.environmentVariables": [
       { "name": "ANTHROPIC_BASE_URL", "value": "https://integrate.api.nvidia.com/v1" },
       { "name": "ANTHROPIC_AUTH_TOKEN", "value": "<your-nvidia-api-key>" },
       { "name": "ANTHROPIC_API_KEY", "value": "" },
       { "name": "ANTHROPIC_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "ANTHROPIC_DEFAULT_SONNET_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "ANTHROPIC_DEFAULT_HAIKU_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "ANTHROPIC_DEFAULT_OPUS_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" },
       { "name": "CLAUDE_CODE_SUBAGENT_MODEL", "value": "nvidia/nemotron-3-ultra-550b-a55b" }
     ]
   }
   ```
3. Run `node ./scripts/claude-doctor.mjs` to confirm provider detection and gitignore safeguards.

