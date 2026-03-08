/**
 * Test Harness Entry Point
 *
 * Bundles the minimal dependencies needed to run ability tests
 * without WordPress. Exposes them on window.TestHarness for the
 * test page to consume.
 *
 * Built as a separate webpack entry point:
 *   wp-scripts build src/extensions/test-harness.js --output-path=build-extensions
 *
 * @since 0.4.1
 */

import * as webllm from '@mlc-ai/web-llm';
import { ReactAgent } from './services/react-agent';
import { toolRegistry, ToolRegistry } from './services/tool-registry';

window.TestHarness = {
	webllm,
	ReactAgent,
	ToolRegistry,
	toolRegistry,
};
