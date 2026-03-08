/**
 * Core Abilities — Tool Selection Tests
 *
 * Tests that the LLM correctly selects built-in abilities for various user inputs.
 * Run with: npm run test:abilities -- --file tests/abilities/core-abilities.test.js
 *
 * For a minimal template to copy, see example.test.js in this directory.
 *
 * @since 0.5.0
 */

module.exports = {
	abilities: [
		{
			id: 'wp-agentic-admin/error-log-read',
			label: 'Read error logs',
			description:
				'Read the PHP error log (debug.log). Returns error entries, debug logging status, and file existence. Use for errors, crashes, white screens, or debug mode questions.',
		},
		{
			id: 'wp-agentic-admin/plugin-list',
			label: 'List installed plugins',
			description:
				'List all installed WordPress plugins with their active/inactive status, version, and author. Use for questions about installed plugins, plugin counts, or which plugins are active.',
		},
		{
			id: 'wp-agentic-admin/site-health',
			label: 'Check site health',
			description:
				'Run a site health check. Returns PHP version, WordPress version, server software, active theme, memory limit, debug mode, and database size.',
		},
		{
			id: 'wp-agentic-admin/cache-flush',
			label: 'Flush cache',
			description:
				'Clear all WordPress object caches (page cache, object cache, opcode cache). Use when the user wants to flush, clear, purge, or refresh caches.',
		},
		{
			id: 'wp-agentic-admin/db-optimize',
			label: 'Optimize database',
			description:
				'Optimize WordPress database tables to reclaim space and improve query performance. Returns the number of tables optimized and space saved.',
		},
	],

	tests: [
		// Tool selection tests
		{
			input: 'list all installed plugins',
			expectTool: 'wp-agentic-admin/plugin-list',
		},
		{
			input: 'show me the error log',
			expectTool: 'wp-agentic-admin/error-log-read',
		},
		{
			input: 'is debug mode enabled?',
			// Both error-log-read and site-health return debug mode status — either is valid.
			expectTool: [
				'wp-agentic-admin/error-log-read',
				'wp-agentic-admin/site-health',
			],
		},
		{
			input: 'check my site health',
			expectTool: 'wp-agentic-admin/site-health',
		},
		{
			input: 'flush the cache',
			expectTool: 'wp-agentic-admin/cache-flush',
		},
		{
			input: 'optimize the database',
			expectTool: 'wp-agentic-admin/db-optimize',
		},

		// No-tool tests (pure knowledge questions)
		{
			input: 'what is a transient?',
			expectTool: null,
		},
		{
			input: 'explain the difference between posts and pages',
			expectTool: null,
		},
	],
};
