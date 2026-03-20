# CloudFest Hackathon 2026 — Progress Tracker

Live progress for the WP Agentic Admin hackathon project. Updated as milestones are reached.

## Day 1 — March 20 (Hackathon Kickoff)

### Infrastructure
- [x] **Dev branch workflow** — established `feature/*` → `dev` → `main` branching strategy
- [x] **`npm run playground`** — one-command WordPress Playground with plugin activated (PHP 8.3, WP 6.9, debug mode)
- [x] **`/assign` GitHub Action** — contributors can self-assign issues by commenting `/assign`
- [x] **Cross-linked scaling issues** — #20 (tool selection at scale) ↔ #37 (contextual skill loading)
- [x] **Contributor notes posted** on #37 with starting points, constraints, and dev setup

### First PR Merged! — theme-list ability (PR #40 by @ivdimova)
Our first hackathon contribution is in! ivdimova added a **theme-list ability** that lets the AI list all installed WordPress themes with their active/inactive status, version, and parent theme info. The ability uses `wp_get_themes()` on the PHP side and includes full chat integration (summarize, interpretResult) on the JS side. Three new test cases were added and the full suite passed **21/21 (100%)** against Qwen 3 1.7B via Ollama. This brings us to **15 abilities** total.

### Contributors
- ivdimova — theme-list ability (PR #40, merged), self-assigned to #29 (web-search ability)

---

## Pre-Hackathon (through v0.9.5)

### Core Engine
- [x] Local LLM via WebLLM + WebGPU (Qwen 3 1.7B default, Qwen 2.5 7B alternative)
- [x] Service Worker model hosting — persists across page navigations
- [x] ReAct agent loop with 3-tier routing (workflow → ReAct → conversational)
- [x] Dual-mode: function-calling (Qwen 3) and prompt-based JSON (Qwen 2.5)
- [x] Streaming `<think>` blocks with collapsible UI
- [x] Post-tool nothink optimization for faster answers

### Abilities (15 total)
- [x] 13 plugin abilities: plugin list/activate/deactivate, theme list, cache flush, db optimize, error log, cron list, revision cleanup, rewrite list/flush, site health, transient flush
- [x] 2 core WordPress wrappers: get-site-info, get-environment-info

### Testing
- [x] 43 unit tests (Jest, mock LLM)
- [x] Ability test suite via Ollama (real Qwen 3 1.7B, 100% accuracy)
- [x] E2E test infrastructure

### Documentation
- [x] Architecture guide, Abilities guide, Workflows guide
- [x] 12-topic AI Fundamentals guide
- [x] CONTRIBUTING.md, SECURITY.md, LICENSE

---

## Planned / In Progress

| Issue | Title | Assignee | Status |
|-------|-------|----------|--------|
| #29 | web-search ability | ivdimova | Assigned |
| #37 | Contextual skill loading | — | Open |
| #12 | Sidebar toggle + slide-out panel | — | Open |
| #33 | Gutenberg sidebar integration | — | Open |
| #28 | query-database ability | — | Open |
| #26 | read-file ability | — | Open |
| #27 | write-file ability | — | Open |
| #30 | Edge AI consultation | — | Open |
| #31 | Google Prompt API bridge | — | Open |
| #32 | WebMCP integration | — | Open |
| #22 | CI/CD GitHub Actions | — | Open |

---

*Last updated: March 20, 2026*
