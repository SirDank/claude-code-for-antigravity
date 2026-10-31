---
trigger: model_decision
description: Policy for when to delegate complex investigation, adversarial code review, or worktree tasks to Claude Code.
---

# Claude Code Escalation Policy

When handling software engineering tasks in this workspace:

1. **Adversarial Code Review**: For critical changes, invoke `/claude-review` or run `claude-specialist` to perform an independent sanity check on `git diff` before opening a pull request.
2. **Investigation & Heavy Context**: For wide codebase scans or deep root-cause debugging, offload investigation turns to `claude-delegate` to keep the primary conversation context lean.
3. **Mundane & Bulk Tasks**: When configured with `.claude/settings.local.json` pointing to free/budget models (e.g. OpenRouter Nemotron), delegate repetitive boilerplate or documentation updates to Claude Code to preserve Antigravity token limits.
4. **Worktree Isolation**: For complex refactoring, use `claude-handoff` to quarantine edits within a Git worktree until verified by tests.

