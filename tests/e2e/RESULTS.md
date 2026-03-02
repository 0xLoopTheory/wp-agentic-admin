# E2E Test Results — Model Comparison

**Date:** 2026-03-02
**Browser:** Chrome via DevTools MCP
**WordPress:** 6.9.1, PHP 8.3.29, nginx/1.29.5
**Mode:** Prompt-based JSON (both models)

---

## Head-to-Head Summary

| Category | Hermes 2 Pro 7B | Qwen 2.5 7B |
|----------|:-:|:-:|
| L2: Single Tool Selection (5) | 80% (4/5) | **100% (5/5)** |
| L2: Conversational (3) | 100% (3/3) | **100% (3/3)** |
| L2: Multi-Tool Chains (3) | 67% (2/3) | **67% (2/3)** |
| L2: Error Recovery (2) | 100% (2/2) | **100% (2/2)** |
| L2: JSON Reliability (8) | 63% (5/8) | **100% (8/8)** |
| L3: Goal Completion (3) | 67% (2/3) | **100% (3/3)** |
| L3: Complex Multi-Step (2) | 50% (1/2) | **100% (2/2)** |
| L3: Conditional Logic (1) | 100% (1/1) | **100% (1/1)** |
| **Total (27)** | **74% (20/27)** | **96% (26/27)** |

**Winner: Qwen 2.5 7B — 96% vs 74%**

---

## Qwen 2.5 7B Detailed Results

**Model:** Qwen2.5-7B-Instruct-q4f16_1-MLC (Q4, ~4.5GB, ~5.1GB VRAM)
**Mode:** Auto-detected (prompt-based JSON)

### L2: Single Tool Selection (5/5 = 100%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| List plugins | "list all installed plugins" | PASS | plugin-list | 13s |
| Site health | "check my site health status" | PASS | site-health | 17s |
| Error log | "show me the PHP error log" | PASS | error-log-read | 27s |
| DB optimize | "optimize the database" | PASS | db-optimize | 15s |
| Flush cache | "flush the object cache" | PASS | cache-flush | 9s |

Notes:
- All 5 passed first try, 1 tool each. Clean responses.
- Hermes needed retries and called extra tools for DB optimize and cache flush.

### L2: Conversational — No Tools (3/3 = 100%)

| Test | Input | Result | Time |
|------|-------|--------|------|
| What is WordPress? | "what is WordPress?" | PASS | 13s |
| Password reset | "how do I reset my WordPress password?" | PASS | 15s |
| Posts vs pages | "what is the difference between posts and pages?" | PASS | 15s |

Notes:
- Rich markdown-formatted responses with headers and numbered lists.
- Both models scored 100% here.

### L2: Multi-Tool Chains (2/3 = 67%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| Health + Optimize | "check site health and optimize the database" | PASS | 2 tools | 5s |
| Plugins + Health | "list my plugins and check site health" | PASS | 2 tools | 5s |
| Errors + Cache | "check the error log and flush the cache" | PARTIAL | 1 tool (error-log only) | 19s |

Notes:
- Test 3: Called error-log-read but claimed cache was flushed without calling the tool.
- Hermes failed test 3 entirely with "Unknown action type"; Qwen at least completed the first step.

### L2: Error Recovery (2/2 = 100%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| Missing plugin | "activate the jetpack plugin" | PASS | plugin-activate | 11s |
| Vague request | "fix my website" | PASS | site-health | 17s |

Notes:
- Test 1: Correctly reported "plugin file not found."
- Test 2: Qwen proactively ran site-health to diagnose (Hermes just said "rephrase your request").

### L2: JSON Reliability (8/8 = 100%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| list my plugins | — | PASS | plugin-list | 11s |
| show site health | — | PASS | site-health | 21s |
| check the error log | — | PASS | error-log-read | 23s |
| flush all caches | — | PASS | cache-flush | 9s |
| what plugins are active? | — | PASS | plugin-list | 9s |
| is WP up to date? | — | PASS | core/get-site-info | 9s |
| check site health status | — | PASS | 2 tools | 5s |
| show server info | — | PASS | core/get-site-info | 15s |

Notes:
- **100% JSON parse success.** Hermes was 63% (5/8) with 3 parse failures.
- This is the biggest improvement — Qwen produces valid JSON consistently.

### L3: Goal Completion (3/3 = 100%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| Stop after listing | "list all installed plugins" | PASS | plugin-list (1) | 13s |
| Stop after cache flush | "flush the object cache" | PASS | cache-flush (1) | 9s |
| Stop after DB optimize | "run database optimization" | PASS | db-optimize (1) | 15s |

Notes:
- All 3 tests: exactly 1 tool, then stop. Perfect goal efficiency.
- Hermes over-shot (3 tools for cache flush) and failed DB optimize entirely.

### L3: Complex Multi-Step (2/2 = 100%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| Diagnose slow site | "my site is slow, find out why and fix what you can" | PASS | 7 tools | 65s |
| Errors then optimize | "check error log and if DB errors, optimize" | PASS | error-log-read → db-optimize | 17s |

Notes:
- Test 1: 7-tool diagnostic chain (site-health → plugin-list → cache-flush → transient-flush → revision-cleanup → cron-list → rewrite-flush). Thorough and logical.
- Test 2: **This is the test Hermes failed.** Qwen correctly checked error log first, then optimized. Proper 2-step conditional reasoning.

### L3: Conditional Logic (1/1 = 100%)

| Test | Input | Result | Tools Called | Time |
|------|-------|--------|-------------|------|
| Health then optimize | "check site health and if DB needs attention, optimize it" | PASS | 2 tools | 5s |

---

## Key Differences: Qwen vs Hermes

| Aspect | Hermes 2 Pro 7B | Qwen 2.5 7B |
|--------|----------------|-------------|
| JSON reliability | 63% — frequent parse failures | **100% — no parse failures** |
| Response quality | System prompt leakage, echoed examples | **Clean, well-formatted markdown** |
| Goal efficiency | Over-shot (3 tools for 1-tool tasks) | **Precise — 1 tool per single-goal task** |
| Multi-step reasoning | 50% — skipped steps | **100% — correct step ordering** |
| Error handling | "Rephrase your request" | **Proactive diagnosis** |
| WebLLM FC support | Broken (custom system prompt restriction) | Auto-detected (prompt-based) |
| Determinism | Non-deterministic (same prompt, different results) | **Consistent across runs** |

## Recommendations

1. **Set Qwen 2.5 7B as default model** — significantly better across all categories.
2. Keep Hermes as an alternative option for users who already have it cached.
3. Consider reducing temperature from 0.3 to 0.1 for even more deterministic output.
4. Minor: fix the JSON envelope leak in final answers (some responses still show `{"action": "final_answer", ...}` wrapper text).

---

## Hermes 2 Pro 7B Detailed Results (Previous Run)

**Model:** Hermes-2-Pro-Mistral-7B-q4f16_1-MLC (Q4, ~4.5GB)
**Mode:** Prompt-based (forced — WebLLM FC limitation)

| Category | Tests | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| L2: Single Tool Selection | 5 | 4 | 1 | 80% |
| L2: Conversational | 3 | 3 | 0 | 100% |
| L2: Multi-Tool Chains | 3 | 2 | 1 | 67% |
| L2: Error Recovery | 2 | 2 | 0 | 100% |
| L2: JSON Reliability | 8 | 5 | 3 | 63% |
| L3: Goal Completion | 3 | 2 | 1 | 67% |
| L3: Complex Multi-Step | 2 | 1 | 1 | 50% |
| L3: Conditional Logic | 1 | 1 | 0 | 100% |
| **Total** | **27** | **20** | **7** | **74%** |

Key weaknesses: JSON parse failures (37%), system prompt leakage, non-determinism, goal over-shooting.

---

## Technical Notes

- **WebLLM Hermes FC limitation**: Hermes-2-Pro cannot use `ChatCompletionRequest.tools` with custom system prompts in WebLLM. Workaround: force prompt-based mode.
- **Qwen2.5 auto-detection**: Falls through to FC test, which either succeeds (native FC) or gracefully degrades to prompt-based mode.
- **Service Worker persistence**: Model stays loaded across page reloads via SW cache.
- **Context window**: 4096 tokens configured. Complex 7-tool chains approach the limit.
- **Repeated tool call detection**: Built-in safety prevents infinite loops.
