---
name: claude-setup
description: Diagnose local Claude Code CLI installation, binary path, authentication status, provider configurations (including NVIDIA Build models via Free Claude Code router), and Antigravity integration readiness. Use when verifying Claude Code availability, setting up the bridge, or troubleshooting execution errors.
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
- Checking authentication status and Free Claude Code (FCC) / NVIDIA Build router settings.
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
3. **Claude Settings & Provider**: Free Claude Code (FCC) router on port 8082, NVIDIA Build, or custom provider configuration.
4. **Authentication Status**: Credential file, Free Claude Code token (`freecc`), or environment token validity.
5. **Antigravity CLI**: Detection of `agy` executable or VS Code integration.
6. **Claude VS Code Extension**: Active session lockfile detection.
7. **.gitignore Safeguards**: Auto-appends `.claude/` and `worktrees/` if missing.

## Resolution Paths

### Claude CLI Missing
If `Claude CLI Binary` fails:
- **VS Code Extension**: Install the official `anthropic.claude-code` extension in VS Code. The runner auto-locates its bundled native binary.
- **Standalone CLI**: Run `npm install -g @anthropic-ai/claude-code` or install via uv (`uv tool install free-claude-code`).
- **Manual Path**: Set `CLAUDE_PATH` in your shell environment pointing directly to the `claude` executable.

### Recommended Provider & Model: NVIDIA Build via Free Claude Code (FCC)
NVIDIA Build provides free access to frontier-scale models with phone verification (OTP), granting unlimited requests without daily quota cliff (40 RPM limit):
- **Model**: `nvidia/nemotron-3-ultra-550b-a55b` (#1 on Artificial Analysis Coding Agent Index, 550B hybrid Mamba-MoE with 1M context).
- **Alternative**: `mistralai/mistral-large-4-1t-a52b` ("Le Chonk", 1T parameter MoE).

The bridge integrates with **Free Claude Code (FCC)**, a high-performance router running on `http://127.0.0.1:8082` that translates Anthropic API calls to 61+ OpenAI-compatible providers:

1. **Install Free Claude Code**:
   ```bash
   uv tool install free-claude-code
   ```
2. **Configure Router**:
   Configure `NVIDIA_NIM_API_KEY` via FCC Admin API or settings.
3. **Point Claude Settings to FCC** (`~/.claude/settings.json`):
   ```json
   {
     "env": {
       "ANTHROPIC_BASE_URL": "http://127.0.0.1:8082",
       "ANTHROPIC_AUTH_TOKEN": "freecc",
       "ANTHROPIC_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "ANTHROPIC_DEFAULT_SONNET_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "ANTHROPIC_DEFAULT_HAIKU_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "ANTHROPIC_DEFAULT_OPUS_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]",
       "CLAUDE_CODE_SUBAGENT_MODEL": "nvidia/nemotron-3-ultra-550b-a55b[1m]"
     }
   }
   ```
4. **On-Demand Auto-Start**:
   `claude-runner.mjs` automatically checks `http://127.0.0.1:8082/health` and spawns `fcc-server` on demand if not already running.
5. Run `node ./scripts/claude-doctor.mjs` to confirm provider detection and gitignore safeguards.
