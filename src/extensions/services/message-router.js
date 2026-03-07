/**
 * Message Router
 *
 * Simple routing logic that decides whether to use:
 * 1. A registered workflow (keyword-based detection)
 * 2. ReAct loop (default for everything else, including questions)
 *
 * All messages go through ReAct by default. The ReAct agent handles both
 * tool-based actions and conversational responses — it will answer knowledge
 * questions directly without calling tools, and use tools when needed.
 * This eliminates routing misclassification (e.g., "why is my site slow?"
 * being treated as a pure question) and is fully extensible for third-party
 * abilities without maintaining hardcoded pattern lists.
 *
 * @since 0.1.0
 */

import workflowRegistry from './workflow-registry';
import { createLogger } from '../utils/logger';

const log = createLogger( 'MessageRouter' );

/**
 * @typedef {Object} RouteResult
 * @property {'workflow'|'react'} type       - Route type
 * @property {Object}             [workflow] - Workflow definition (if type is 'workflow')
 */

/**
 * Route a user message to the appropriate handler
 *
 * Routing logic:
 * 1. Check if message matches a registered workflow → workflow mode
 * 2. Default to ReAct loop for everything else (actions AND questions)
 *
 * @param {string} userMessage - The user's message
 * @return {RouteResult} Route decision
 */
export function route( userMessage ) {
	if ( ! userMessage || typeof userMessage !== 'string' ) {
		log.warn( 'Invalid message, defaulting to ReAct' );
		return { type: 'react' };
	}

	// Step 1: Check for workflow keyword match
	const workflow = workflowRegistry.detectWorkflow( userMessage );
	if ( workflow ) {
		log.info( `Detected workflow: ${ workflow.id }` );
		return {
			type: 'workflow',
			workflow,
		};
	}

	// Step 2: Default to ReAct loop for everything
	log.info( 'Routing to ReAct' );
	return { type: 'react' };
}

/**
 * Check if a message would trigger a workflow
 *
 * Utility function for testing/debugging.
 *
 * @param {string} userMessage - The user's message
 * @return {boolean} True if a workflow would be triggered
 */
export function isWorkflowQuery( userMessage ) {
	return route( userMessage ).type === 'workflow';
}

export default { route, isWorkflowQuery };
