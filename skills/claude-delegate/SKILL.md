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

Delegates scoped investigation and analysis tasks to Claude Code (`claude -p`).

## When to Use
- Running deep root-cause debugging without exhausting Antigravity context window.
- Offloading mundane tasks (summaries, repo scans, log parsing) to free/cheaper models via OpenRouter.
- Gathering specialized multi-file findings before synthesizing in Antigravity.

## Usage

### 1. Direct Prompt Invocation
```bash
node ./scripts/claude-runner.mjs --mode read --prompt "Investigate memory leaks in src/session-manager.ts"
```

### 2. File-Based Prompt (Recommended for long prompts)
Write the prompt to a temporary file, then pass it:
```bash
node ./scripts/claude-runner.mjs --mode read --prompt-file ./task-prompt.md --max-turns 15
```

### 3. Digest Contract
The runner automatically writes the complete raw run transcript to:
`.agents/tmp/claude-runs/<session_id>.json`

It prints a compact summary (<2,000 chars) to stdout conforming to Honey Lever 3:
```
=== CLAUDE RUN DIGEST ===
Status: SUCCESS
Session ID: <session_id>
Total Cost: $<cost>
Run Artifact: .agents/tmp/claude-runs/<session_id>.json
Summary:
<concise findings>
=========================
```

## Options
- `--max-turns <n>`: Limit execution steps (default: 15).
- `--max-budget-usd <amount>`: Hard spend ceiling.
- `--tools <list>`: Limit tool access (default: `Read,Grep,Glob`).

