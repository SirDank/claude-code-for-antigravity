---
name: claude-review
description: Run adversarial cross-model code and architecture reviews against git diffs or implementation plans using Claude Code, acting as an auditor gate. Use to catch subtle bugs, security vulnerabilities, or regressions before merging.
license: Apache-2.0
compatibility: node>=18.0.0
metadata:
  category: review
  author: SirDank
---

# Cross-Model Adversarial Review

Dispatches an adversarial code and architecture audit to Claude Code.

## When to Use
- Validating non-trivial code changes prior to submitting a PR or concluding a milestone.
- Performing an independent Auditor / Critic check as part of a `/boost` or `/teamwork` cycle.
- Checking for edge cases, missing error boundaries, security vulnerabilities, or unnecessary complexity.

## How it Works
1. Gathers current `git diff` or plan document.
2. Pipes it to Claude Code with an adversarial auditor system prompt.
3. Restricts execution to read-only tools (`Read,Grep,Glob`).
4. Outputs a terse finding list (one finding per line, categorized by severity).

## Usage

### 1. Review Current Git Diff
```bash
git diff HEAD > .agents/tmp/review.diff
node ./scripts/claude-runner.mjs \
  --mode read \
  --prompt "Perform an adversarial code review on .agents/tmp/review.diff. List edge-case bugs, security risks, and regressions. Format output as a concise finding list." \
  --tools "Read,Grep,Glob"
```

### 2. Review Implementation Plan
```bash
node ./scripts/claude-runner.mjs \
  --mode read \
  --prompt-file ./plan.md \
  --append-system-prompt "You are an adversarial software auditor. Challenge assumptions, find missing dependencies, and identify potential failure points."
```

## Review Output Format
Findings are returned in terse, actionable bullet points:
- `[CRITICAL]` Description of severe bug or vulnerability (`path/file.ext#L12-L20`)
- `[WARN]` Potential edge case or missing boundary condition
- `[NIT]` Minor cleanup or readability improvement

