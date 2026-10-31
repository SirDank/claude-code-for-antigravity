---
name: claude-delegate
description: Delegate investigation, root-cause debugging, or mundane tasks to Claude Code, returning a verified, compact digest to conserve Antigravity context tokens. Use when offloading background investigation or heavy analysis.
license: Apache-2.0
compatibility: node>=18.0.0
metadata:
  category: execution
  author: SirDank
---

# Claude Code Task Delegation

Delegates scoped investigation, boilerplate generation, and analysis tasks to Claude Code (`claude -p`).

## Purpose & Antigravity Quota Conservation
Antigravity models (e.g. Gemini 2.5 Pro) are high-intelligence reasoning powerhouses. Offloading routine, repetitive, or token-heavy mundane tasks to Claude Code configured with top free OpenRouter models (such as `nvidia/nemotron-3-ultra-550b-a55b:free`) saves significant Antigravity quota and context tokens.

### When to Delegate to Save Quota:
- Repetitive boilerplate, interface definitions, and scaffolding (`--task boilerplate`).
- Large docstring, JSDoc, or markdown documentation sweeps (`--task docs`).
- Wide codebase inventory, grep searches, and file relationship scans (`--task scan`).
- Read-only code and diff reviews (`--task review`).
- Deep background root-cause debugging without exhausting Antigravity context.

## Usage

### 1. Quota-Saving Task Presets
Quickly invoke preset workflows with optimized permissions and toolsets:
```bash
# Generate repetitive boilerplate
node ./scripts/claude-runner.mjs --task boilerplate --prompt "Generate CRUD controllers for resources"

# Document codebase or APIs
node ./scripts/claude-runner.mjs --task docs --prompt "Add JSDoc comments to exports in src/lib/"

# Wide repository scan
node ./scripts/claude-runner.mjs --task scan --prompt "Map all API endpoint routes across controllers"

# Adversarial diff review
node ./scripts/claude-runner.mjs --task review --prompt "Audit git diff for edge cases and regressions"
```

### 2. Live Visibility vs Headless Mode
- **`--visible`**: Immediately focuses the Claude Code tab in VS Code and streams token generation live to the terminal. Best when you want to watch execution in real-time.
- **`--headless`** (default): Runs quietly in the background; prints only the final compact digest (<2,000 chars) for Antigravity context preservation.

```bash
# Watch execution live in VS Code and terminal
node ./scripts/claude-runner.mjs --task scan --prompt "Inspect routes" --visible
```

### 3. File-Based Prompts (for complex briefs)
```bash
node ./scripts/claude-runner.mjs --mode read --prompt-file ./task-prompt.md --max-turns 15
```

### 4. Digest Contract (Honey Lever 3)
Raw execution transcripts are preserved in `.agents/tmp/claude-runs/<session_id>.json`. The runner outputs a compact summary (<2,000 chars) to stdout:
```
=== CLAUDE RUN DIGEST ===
Status: SUCCESS
Session ID: <session_id>
Total Cost: $0.00 (Free OpenRouter tier)
Run Artifact: .agents/tmp/claude-runs/<session_id>.json
Summary:
<concise findings>
=========================
```

## Options Reference
- `--task <boilerplate|docs|scan|review>`: Apply pre-configured mode and toolsets.
- `--visible`: Live token streaming + activate Claude Code tab in VS Code.
- `--headless`: Quiet background mode returning compact digest (default).
- `--max-turns <n>`: Execution turn limit (default: 15).
- `--max-budget-usd <amount>`: Spend ceiling.
- `--tools <list>`: Explicit tool whitelist (e.g. `Read,Grep,Glob`).

