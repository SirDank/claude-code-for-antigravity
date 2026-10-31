# Evaluation Methodology

This document outlines the evaluation protocol for measuring performance, token efficiency, and cross-model delegation quality.

## Measurement Pillars
1. **Digest Compression Ratio**: Tokens consumed by Antigravity context when receiving a Claude Code digest versus raw uncompressed tool output.
2. **Execution Latency**: Time from Antigravity tool invocation to digest return.
3. **Audit Catch Rate**: Percentage of deliberate architectural flaws caught by `/claude-review` during pre-merge audit.

## Benchmark Protocol
- Run 10 standardized synthetic tasks (code refactor, bug isolation, architecture review).
- Measure token usage in Antigravity conversation context.
- Measure child process execution time and cost reported by `claude -p` (`total_cost_usd`).

