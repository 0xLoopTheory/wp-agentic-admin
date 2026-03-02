# WP-Agentic-Admin Architecture

This document explains the philosophical and architectural decisions behind WP-Agentic-Admin's approach to AI-assisted WordPress administration using the ReAct (Reasoning + Acting) pattern.

## Table of Contents

- [Philosophy](#philosophy)
- [Target Audience](#target-audience)
- [Design Principles](#design-principles)
- [ReAct Loop Architecture](#react-loop-architecture)
- [Workflow Detection](#workflow-detection)
- [Why Not Agent Skills Format?](#why-not-agent-skills-format)
- [Small Model Optimizations](#small-model-optimizations)
- [Testing](#testing)
- [Evolution](#evolution)
- [Codebase Overview](#codebase-overview)

---

## Philosophy

### The Core Question: Pre-planned vs Adaptive

During the development of WP-Agentic-Admin, we grappled with a fundamental question:

> **Should we pre-plan every action sequence, or let the AI adapt based on what it discovers?**

The answer is: **Mostly adaptive (ReAct), with pre-defined workflows for common patterns.**

### Our Approach

WP-Agentic-Admin uses a **ReAct (Reasoning + Acting) pattern** that balances:

1. **Adaptive execution** - AI decides tools based on observations
2. **Safety first** - Confirmations for destructive actions
3. **Local-first** - Works with small (3B parameter) models running on-device
4. **Workflow shortcuts** - Keyword-based triggers for common multi-step operations

### How ReAct Works

```
User: "My site is slow"
  ↓
AI: "I should check site health first"
  ↓
Tool: site-health → Returns database is 2.5GB
  ↓
AI: "Database is large, I should optimize it"
  ↓
Tool: db-optimize → Optimizes 15 tables
  ↓
AI: "Your database was causing slowness. I optimized it and saved 125MB."
```

The AI decides **one action at a time**, observing results and adapting its strategy. This is more flexible than pre-planned workflows but still reliable because:
- Max 10 iterations prevents infinite loops
- Repeated call detection stops oscillation
- Confirmation required for destructive actions
- Tool errors are observed and handled gracefully

---

## Target Audience

Our design decisions are optimized for these user personas:

### Primary: Site Admins & Hosting Companies

- **Non-technical WordPress site owners** who want AI assistance with maintenance
- **Hosting company support staff** who need intelligent troubleshooting
- **Require:** Reliability, safety, transparency

**What they need:**
- Natural language queries: "something is broken" → AI investigates intelligently
- Adaptive diagnostics: AI chooses tools based on what it finds
- Confirmation before destructive actions
- Clear explanations of what was done

### Secondary: Plugin Developers

- **WordPress developers** extending the system with new capabilities
- **Require:** Clear APIs, WordPress coding standards compliance, extensibility

**What they need:**
- Simple `register_agentic_ability()` API
- PHP/JavaScript dual registration pattern
- WordPress Abilities API integration
- Shared helper functions to avoid duplication

---

## Design Principles

### 1. WordPress-First

We extend the [WordPress Abilities API](https://developer.wordpress.org/news/2025/11/introducing-the-wordpress-abilities-api/) (introduced in WP 6.9) rather than creating a parallel system.

**Why:** Integration with core WordPress, REST API compliance, ecosystem alignment.

### 2. Adaptive by Default

The ReAct loop lets the AI adapt to what it discovers, rather than following rigid scripts.

**Why:** More flexible, handles edge cases better, feels more intelligent.

**Safety mechanisms:**
- Max iterations (10)
- Repeated call detection
- Confirmation for destructive actions
- Context window overflow handling

### 3. Local-First

Everything runs in the browser using WebLLM and WebGPU. No server-side AI required.

**Why:** Privacy, zero server costs, works offline, GDPR compliant by design.

**Service Worker Architecture:** The AI model is hosted in a Service Worker (`sw.js`) using `ServiceWorkerMLCEngineHandler` from WebLLM. This allows the model to persist in GPU memory across wp-admin page navigations -- the model stays loaded as long as at least one browser tab is connected. Client pages communicate with the Service Worker via `postMessage`. This avoids re-downloading and re-loading the model on every page change.

### 4. Small Model Friendly

Optimized for 3B parameter models (Qwen2.5-3B, Llama-3.2-3B).

**Why:** Runs on consumer hardware, lower memory usage, faster inference.

---

## ReAct Loop Architecture

### Message Routing

```
User Message
  ↓
Is it a question? (e.g., "what is a transient?")
  ↓ Yes → Conversational Mode (LLM answers directly)
  ↓ No
  ↓
Does it match a workflow keyword? (e.g., "full site cleanup")
  ↓ Yes → Execute Workflow (pre-defined steps)
  ↓ No
  ↓
ReAct Loop (AI-driven adaptive execution)
```

### ReAct Loop Flow

> **Note:** The ReAct agent supports TWO execution modes: **function-calling mode** (for Hermes-compatible models that support native tool use) and **prompt-based JSON mode** (for Qwen, Flash, and other models that need structured prompts). The mode is auto-detected on the first inference call based on whether the model supports function calling.

```javascript
while (iteration < maxIterations) {
  // AI decides next action
  const action = await llm.chooseAction(observations);

  if (action.type === 'tool_call') {
    // Execute tool
    const result = await executeTool(action.tool, action.args);

    // Add to observations
    observations.push({ tool: action.tool, result });

    // Check for repeated calls
    if (lastTool === action.tool) {
      // Stop loop, provide summary
      return buildSummary(observations);
    }

    iteration++;
  } else if (action.type === 'final_answer') {
    // AI is done
    return action.content;
  }
}

// Max iterations reached
return "I reached the maximum number of steps...";
```

### Key Components

**1. React Agent (`react-agent.js`)**
- Core ReAct loop implementation
- Dual-mode support: Function calling + Prompt-based JSON
- Observation tracking
- Confirmation handling
- Error recovery

**2. Message Router (`message-router.js`)**
- Question detection (regex patterns)
- Workflow keyword matching
- Default to ReAct loop

**3. Tool Registry (`tool-registry.js`)**
- Registers all available abilities
- Converts to function calling format
- Handles tool execution

---

## Workflow Detection

For common multi-step operations, pre-defined workflows can be triggered via keywords:

### Why Workflows?

- **Efficiency:** Known patterns execute faster than ReAct exploration
- **Consistency:** Same steps every time for common tasks
- **User expectations:** "full site cleanup" should be comprehensive and predictable

### How It Works

```javascript
// Simplified overview - actual execution goes through WorkflowOrchestrator.execute()
// which handles: confirmation prompts, includeIf conditions, mapParams,
// rollback support, optional steps, and abort.
const workflow = workflowRegistry.detectWorkflow(userMessage);

if (workflow) {
  // WorkflowOrchestrator handles the full execution lifecycle:
  // - Prompts for confirmation if requiresConfirmation is set
  // - Evaluates includeIf conditions per step (may skip steps)
  // - Resolves mapParams from previous step results
  // - Tracks rollback stack for write operations
  // - Marks optional steps as skipped on failure instead of aborting
  // - Calls workflow.summarize() to build final user message
  await workflowOrchestrator.execute(workflow.id, { userMessage });
} else {
  // Fall back to ReAct loop
  await reactAgent.execute(userMessage);
}
```

### Workflow Examples

**"full site cleanup"** → Semi-flexible workflow:
1. Flush cache (always runs)
2. Optimize database (conditional `includeIf` -- skips if not needed, e.g., optimized recently or user did not mention database)
3. Check site health (always runs)

**"check site performance"** → Semi-flexible workflow:
1. Get site health info (always runs)
2. Read error log (optional, with `includeIf` condition -- only runs if debug mode is enabled or user mentioned errors)

**"my site is slow"** → ReAct loop (adaptive):
- AI decides what to check first
- Adapts based on findings
- May call different tools depending on the situation

---

## Why Not Agent Skills Format?

We considered using the [Agent Skills specification](https://github.com/microsoft/autogen/tree/main/autogen/skills) but chose a simpler approach:

### Agent Skills (Rejected)

```yaml
skills:
  - name: database-cleanup
    steps:
      - check-db-size
      - optimize-if-large
      - verify-result
```

**Downsides:**
- Another spec to learn
- Over-engineering for our use case
- Doesn't leverage WordPress Abilities API
- Complex for third-party developers

### WordPress Abilities (Chosen)

```php
register_agentic_ability('wp-agentic-admin/db-optimize', [
    'label' => 'Optimize Database',
    'description' => 'Optimize database tables',
    'category' => 'sre-tools',
]);
```

**Benefits:**
- WordPress-native
- Simple registration
- REST API integration
- Ecosystem alignment
- Easy for plugin developers

---

## Small Model Optimizations

WP-Agentic-Admin is optimized to work well with 3B parameter models (Qwen2.5-3B, Llama-3.2-3B) running locally.

### Challenges with Small Models

1. **JSON formatting** - Small models struggle with structured output
2. **Over-eagerness** - Calling too many tools
3. **Error recovery** - Poor handling of tool failures
4. **Context limits** - 4096 tokens for Qwen2.5-3B (default context_window_size config is 2048, expanded to 4096 per model)

### Our Solutions

**1. Robust JSON Parsing**
- Sanitize control characters
- Fix common syntax errors (single quotes, missing quotes)
- Extract first valid JSON object
- Graceful fallback on parse failure

**2. Safety Mechanisms**
- Repeated call detection (same tool twice = stop)
- Max 10 iterations
- Tool result truncation (1000 chars max in prompt-based JSON mode; function-calling mode passes full results). Additionally, the ChatOrchestrator truncates tool results to 1500 chars when building LLM summary prompts for conversational responses.
- Context window overflow handling

**3. Pre-filtering**
- Questions detected before ReAct (regex patterns)
- Prevents "what is a transient?" from calling tools
- Reduces unnecessary LLM calls

**4. Dual-Mode Support**
- Function calling for models that support it (Hermes)
- Prompt-based JSON for models that don't (Qwen, Flash)
- Auto-detection on first run

### TODO: Hackathon Improvements

Several areas identified for future exploration:

1. **Prompt Engineering** - Simplify language for smaller models
2. **Error Recovery** - Better handling of tool failures
3. **JSON Robustness** - Smarter parsing strategies
4. **Question Detection** - Better than regex for small models

See inline `TODO Hackathon` comments in the codebase for details.

---

## Testing

WP-Agentic-Admin includes automated tests for core services:

- `react-agent.test.js` - Tests for the ReAct loop, including function-calling and prompt-based modes, iteration limits, repeated call detection, and error handling
- `message-router.test.js` - Tests for 3-way message routing (conversational, workflow, react)
- Mocked LLM responses for deterministic testing
- Real-world test cases based on manual testing findings

Run tests with `npm test` to verify functionality.

---

## Evolution

The architecture will continue to evolve:

**Current (v0.1.1):**
- ReAct loop for adaptive execution
- Workflow keyword detection for common patterns
- Optimized for 3B models (Qwen2.5-3B, Llama-3.2-3B)

**Future Enhancements:**
- Improved prompt engineering for smaller models
- Better error recovery strategies
- More sophisticated workflow composition
- Support for larger models (7B+) when available

The goal is to make the AI **more reliable and helpful** while keeping it **local-first and privacy-preserving**.

---

## Codebase Overview

### Service Modules

The following service modules live in `src/extensions/services/` and `src/extensions/utils/`:

- **ChatOrchestrator** (`chat-orchestrator.js`) - Main message coordinator. Routes messages via MessageRouter to conversational, workflow, or ReAct paths. Builds system prompts, manages LLM summary generation, and truncates tool results to 1500 chars for summary prompts.
- **ChatSession** (`chat-session.js`) - Chat history management with `localStorage` persistence. Tracks messages, tool calls, and session metadata.
- **StreamSimulator** (`stream-simulator.js`) - Typewriter-style text streaming for chat responses, providing a natural reading experience.
- **ModelLoader** (`model-loader.js`) - WebLLM model management. Handles model download, loading, and inference. Uses a Service Worker (`sw.js`) for model persistence across page navigations.
- **AIService** (`ai-service.js`) - Legacy keyword-based ability detection (fallback path when ReAct is not available).
- **AbilitiesAPI** (`abilities-api.js`) - REST client for the WordPress Abilities API. Fetches registered abilities from the server.
- **AgenticAbilitiesAPI** (`agentic-abilities-api.js`) - Public JavaScript registration API exposed as `wp.agenticAdmin.*`. Allows JS-side ability and workflow registration.
- **ToolRegistry** (`tool-registry.js`) - JavaScript-side ability registration and keyword matching. Converts abilities to function-calling format for the LLM.
- **WorkflowRegistry** (`workflow-registry.js`) - Workflow registration and keyword-based detection. Matches user messages to pre-defined workflows.
- **WorkflowOrchestrator** (`workflow-orchestrator.js`) - Workflow execution engine with rollback support, `includeIf` conditional steps, `mapParams`, optional steps, confirmation prompts, and abort handling.
- **MessageRouter** (`message-router.js`) - 3-way message routing: conversational (question detection via regex), workflow (keyword matching), and ReAct (default fallback).
- **ReactAgent** (`react-agent.js`) - Core ReAct loop with dual-mode support (function-calling and prompt-based JSON). Handles observation tracking, confirmation, repeated-call detection, and error recovery.
- **Logger** (`utils/logger.js`) - Centralized logging with configurable levels. Used across all services via `createLogger('ModuleName')`.

### React UI Components

The frontend is built with React (via `@wordpress/element`) in `src/extensions/`:

- **App.jsx** - Root component with two tabs: **Chat** and **Abilities**
- **ChatContainer.jsx** - Chat panel layout, manages message flow between ChatInput and MessageList
- **ChatInput.jsx** - User input field with send button
- **MessageList.jsx** - Scrollable message display area
- **MessageItem.jsx** - Individual message rendering (user, assistant, tool results, confirmations)
- **AbilityBrowser.jsx** - Abilities tab, lists all registered abilities and workflows
- **WebGPUFallback.jsx** - Fallback UI shown when the browser does not support WebGPU
- **ModelStatus.jsx** - Model loading progress indicator and status display

### Settings System

The PHP settings system is managed by `class-settings.php` (`includes/class-settings.php`):

- **Model selection** - Choose which AI model to use (Phi-3.5-mini, Llama-3.2-1B, Llama-3.2-3B)
- **Confirm destructive actions** - Toggle requiring user confirmation before executing destructive abilities (enabled by default)
- **Max log lines** - Configure the maximum number of log lines to read at once (default: 100)

Settings are stored as a single WordPress option (`wp_agentic_admin_settings`) and accessed via the `Settings` singleton.

---

## References

- [WordPress Abilities API](https://github.com/WordPress/abilities-api)
- [WebLLM](https://github.com/mlc-ai/web-llm)
- [ReAct Pattern Paper](https://arxiv.org/abs/2210.03629)
- [Abilities Guide](ABILITIES-GUIDE.md)
- [Workflows Guide](WORKFLOWS-GUIDE.md)
