/**
 * Example Ability Test File
 *
 * Copy this template to your own plugin and modify it to test your abilities.
 * See core-abilities.test.js for a real-world example with more test cases.
 *
 * Usage:
 *   npm run test:abilities -- --file tests/abilities/example.test.js
 *
 * Test file format:
 *   module.exports = {
 *     abilities: [ ... ],  // Array of ability definitions to register
 *     tests: [ ... ],      // Array of test cases to run
 *   };
 *
 * Each test case:
 *   {
 *     input: 'user message',       // What the user types
 *     expectTool: 'ability-id',    // Which tool should be called (null = no tool)
 *                                  // Can also be an array: ['tool-a', 'tool-b'] to accept either
 *   }
 *
 * @since 0.5.0
 */

module.exports = {
	// Define the abilities the model should choose from.
	// Only id, label, and description are needed — execute() is stubbed automatically.
	abilities: [
		{
			id: 'my-plugin/check-status',
			label: 'Check system status',
			description:
				'Check the health status of the system. Returns whether all services are healthy and any issues found.',
		},
		{
			id: 'my-plugin/clear-cache',
			label: 'Clear cache',
			description:
				'Clear all caches. Use when the user wants to flush or purge caches.',
		},
	],

	tests: [
		// Tool selection — model should pick the right ability
		{
			input: 'is everything running ok?',
			expectTool: 'my-plugin/check-status',
		},
		{
			input: 'clear the cache',
			expectTool: 'my-plugin/clear-cache',
		},

		// No tool — model should answer directly
		{
			input: 'what is WordPress?',
			expectTool: null,
		},
	],
};
