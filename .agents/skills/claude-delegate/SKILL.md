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

### 2. Automatic Live Visibility Cascade
Execution visibility automatically detects and adapts to your environment:
1. **VS Code Panel (Default when VS Code is open)**: If an active Claude Code extension instance is running, it automatically opens the Claude Code panel and streams live tokens.
2. **Terminal Stream**: If running from an interactive terminal without the panel, it streams live tokens directly to stdout.
3. **Headless Fallback**: In non-interactive subagent or CI environments, it runs silently and returns only the compact digest (<2,000 chars) to preserve context.
4. **Explicit Overrides**: Pass `--headless` to force silent execution, or `--visible` to force panel activation.

```bash
# Auto-detects panel/terminal automatically
node ./scripts/claude-runner.mjs --task scan --prompt "Inspect routes"

# Force silent headless background execution
node ./scripts/claude-runner.mjs --task scan --prompt "Inspect routes" --headless
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

