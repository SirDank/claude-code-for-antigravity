# Honest Numbers & Benchmark Report

This document reports empirical measurements collected on the reference test system (Node.js v23.11.0, Windows 11, Claude Code v2.1.314).

## Startup & Doctor Latency
- `node scripts/claude-doctor.mjs`: ~380ms end-to-end execution time.
- `node scripts/session-start-hook.mjs`: ~35ms startup check overhead.

## Context Window & Token Bounds
- **Raw Claude Code JSON**: Typically 15,000 to 120,000 characters depending on turns and file diffs.
- **Enforced Digest Contract**: Strictly capped under 2,000 characters (~400-500 tokens).
- **Token Savings for Antigravity Context**: >90% reduction in context window consumption compared to streaming full child process transcripts.

## Caveats & Constraints
1. **Network Sandbox**: Running inside an Antigravity sandbox without network allowlisting (`read_url(api.anthropic.com)` or `integrate.api.nvidia.com`) will block child process API calls.
2. **Windows CLI Resolution**: Claude Code bundled in the VS Code extension does not automatically configure system PATH. The multi-stage detector resolves this in ~15ms.

