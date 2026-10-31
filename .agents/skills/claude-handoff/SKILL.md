---
name: claude-handoff
description: Execute autonomous code modifications in an isolated Git worktree using Claude Code, with independent verification checks before merging. Use for complex multi-file implementations requiring scoped execution.
license: Apache-2.0
compatibility: node>=18.0.0
metadata:
  category: execution
  author: SirDank
---

# Test-Gated Worktree Handoff

Delegates code implementation to Claude Code in an isolated Git worktree, followed by independent Antigravity audit verification.

## When to Use
- Implementing multi-file features where edits must be quarantined until proven functional.
- Delegating complex refactors that require running local test suites.
- Implementing the Worker phase of `/teamwork` or `/boost` with cross-model isolation.

## Workflow

```
[Antigravity Orchestrator]
       │  (1) Spawn isolated worktree
       ▼
[Claude Code Runner (worktree)]
       │  (2) Edit code & run local tests
       ▼
[Worktree Verification Gate]
       │  (3) Run tests & inspect git diff --stat
       ▼
[Merge / Cherry-pick to Main Workspace]
```

## Usage

### 1. Dispatch Implementation in Worktree
```bash
node ./scripts/claude-runner.mjs \
  --mode worktree \
  --prompt "Implement the user authentication endpoint and write unit tests." \
  --permission-mode acceptEdits \
  --max-turns 20
```
*Note: The runner automatically cleans up dead worktree references via `git worktree prune` upon process completion.*

### 2. Independent Audit Gate (Run in Antigravity)
Before accepting the changes from the worktree:
1. Check the files modified:
   ```bash
   git -C <worktree-path> diff --stat
   ```
2. Run the project's test suite inside the worktree:
   ```bash
   npm --prefix <worktree-path> test
   ```
3. Only if all automated checks pass, merge or apply the patch to the primary branch.

