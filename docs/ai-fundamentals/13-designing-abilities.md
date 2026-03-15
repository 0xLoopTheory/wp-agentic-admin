# Designing Abilities — A Guide for Writers & UX Contributors

This chapter is for **Writers** (who invent use cases and write ability specs) and **UX/Design contributors** (who design how users interact with the AI). No coding required — your work feeds directly into what PHP and JS developers build.

## How Abilities Get Built

Every ability starts as a use case, moves through design, and ends as code:

```
Writer defines use case → UX designs interaction → PHP dev builds backend → JS dev builds frontend → Tester verifies
```

Your job as a Writer or Designer is the first two steps. Without a clear spec, developers are guessing.

## Writing a Use Case Spec (Writers)

A good use case spec answers five questions:

### 1. What would the user say?

Think about how a real WordPress admin would phrase their request — they won't use technical terms. List 3-5 natural language variations:

```
"Are any of my plugins out of date?"
"Check for updates"
"Do I need to update anything?"
"What versions are my plugins on?"
"Is WordPress itself up to date?"
```

These become the ability's **keywords** and test prompts. The more variations you provide, the better the AI can match user intent.

### 2. What should the AI do?

Describe the WordPress operation in plain language:

> Check all installed plugins, themes, and WordPress core for available updates.
> Return a list of items with updates available, including current and latest version numbers.

Include what data the ability reads or changes:
- **Reads:** Plugin versions, theme versions, core version, update API
- **Changes:** Nothing (read-only)

### 3. What does the response look like?

Sketch the ideal AI response:

> You have 3 updates available:
> - **Yoast SEO** — 22.0 → 22.1 (minor update)
> - **WooCommerce** — 8.5 → 9.0 (major update — check compatibility)
> - **WordPress Core** — 6.9 → 6.9.1 (security patch — update recommended)

This helps developers understand what data to return and helps the AI know how to summarize results.

### 4. Is it destructive?

Classify the operation:

| Type | Definition | Example | Needs confirmation? |
|------|-----------|---------|-------------------|
| **Read-only** | Just reads data, changes nothing | List plugins, check health | No |
| **Safe write** | Changes something reversible | Flush cache, flush rewrite rules | No |
| **Destructive** | Could break something or lose data | Deactivate plugin, delete revisions | Yes |

If destructive, also describe what the confirmation dialog should say and whether a "preview/dry-run" mode is possible.

### 5. What could go wrong?

List failure scenarios so developers can handle them:
- User doesn't have permission (not an admin)
- Network error reaching the update API
- No updates available (not an error — just a different response)
- Plugin update info is cached and stale

### Example: Full Use Case Spec

```
Ability: update-check
Type: Read-only

User might say:
- "Are there any updates available?"
- "Check for plugin updates"
- "Is my WordPress up to date?"
- "What needs updating?"

What it does:
Queries WordPress update API for plugins, themes, and core.
Returns list of available updates with version numbers.

Response sketch:
"You have 2 updates available:
- Yoast SEO: 22.0 → 22.1
- WordPress Core: 6.9 → 6.9.1 (security patch)
Everything else is up to date."

If nothing to update:
"Everything is up to date! All 12 plugins, 2 themes,
and WordPress core are on their latest versions."

Failure cases:
- No permission → "You need administrator access to check updates."
- API unreachable → "Couldn't reach the WordPress update server. Try again later."
```

## Designing Ability Interactions (UX/Design)

### The Chat Flow

Users interact with abilities through a chat interface. Keep these principles in mind:

**1. Responses should be scannable, not walls of text.**

Bad:
> I checked your site health and found that your page load time is 4.2 seconds which is above the recommended 2 seconds threshold and you have 38 active plugins installed which is more than the recommended 15-20 and your PHP memory usage is at 245MB out of 256MB which is critically high.

Good:
> Your site is loading in **4.2s** (target: under 2s). Main issues:
> - **38 active plugins** (recommended: 15-20)
> - **Memory nearly full** — 245MB / 256MB
>
> Want me to list plugins by resource usage?

**2. Offer follow-up actions, don't dead-end.**

After showing results, the AI should suggest what the user can do next. This is defined in the ability's `summarize` function.

**3. Destructive actions need clear confirmation dialogs.**

The confirmation modal should include:
- **What** will happen (plain language, not technical IDs)
- **What might break** (consequences)
- **How to undo** (if possible)

Example for plugin deactivation:
```
┌─────────────────────────────────────┐
│  Confirm Action                     │
│                                     │
│  Deactivate "WooCommerce"?          │
│                                     │
│  ⚠️  This will disable your online  │
│  store. Product pages will show     │
│  errors until reactivated.          │
│                                     │
│  [Cancel]              [Deactivate] │
└─────────────────────────────────────┘
```

### Model Loading Experience

The AI model is a ~1.2GB download on first use. This is the user's first impression — make it count:

- Show a **progress bar** with percentage and estimated time
- Explain **what's happening** ("Downloading AI model — this only happens once")
- Explain **where it's stored** ("Saved in your browser — no server involved")
- Show the model is **ready** with a clear status change
- On return visits, show **"Model loaded from cache"** (instant)

### Sidebar Design Considerations

The chat lives in a sidebar accessible from every wp-admin page:

- **Toggle:** Easy to open/close without losing conversation
- **Width:** Wide enough to read responses, narrow enough to not hide the admin page
- **Responsive:** Collapses cleanly on smaller screens
- **Persistent:** Conversation survives page navigation (Service Worker keeps model loaded)
- **Non-blocking:** Never prevent the user from using the admin normally

## What Makes a Good Ability Description

The ability's `description` field is sent to the LLM every request — it's how the AI knows when to use the tool. Good descriptions are:

**Specific, not vague:**
- Bad: "Manages plugins"
- Good: "List all installed plugins with their active/inactive status and version numbers"

**Action-oriented:**
- Bad: "Plugin information tool"
- Good: "Check which plugins are installed and whether they are active or inactive"

**Include trigger scenarios:**
- Bad: "Site health check"
- Good: "Run a site health check to diagnose slow performance, high memory usage, or configuration issues"

Keep descriptions under 30 words — they consume the LLM's limited context window.

## Summary

Writers and UX contributors shape the AI's capabilities and user experience. A clear use case spec — with natural language triggers, expected behavior, response sketches, and failure cases — gives developers everything they need to build the right ability. Good UX design ensures the AI feels helpful, not intimidating, from the first model download through every interaction.

**Next:** [Glossary](glossary.md)
