/**
 * Message Router Tests
 *
 * Tests the 2-tier routing logic:
 * 1. Workflow mode (keyword-based detection)
 * 2. ReAct mode (default for everything else — actions AND questions)
 */

import { route, isWorkflowQuery } from '../message-router';
import workflowRegistry from '../workflow-registry';

// Mock workflow registry
jest.mock( '../workflow-registry', () => ( {
	detectWorkflow: jest.fn(),
} ) );

// Mock logger to suppress console output
jest.mock( '../../utils/logger', () => ( {
	createLogger: () => ( {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
	} ),
} ) );

describe( 'MessageRouter', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Workflow Routing (Keywords)', () => {
		it( 'should route workflow keywords to workflow mode', () => {
			const mockWorkflow = {
				id: 'site-cleanup',
				label: 'Full Site Cleanup',
			};
			workflowRegistry.detectWorkflow.mockReturnValue( mockWorkflow );

			const result = route( 'full site cleanup' );

			expect( result.type ).toBe( 'workflow' );
			expect( result.workflow ).toBe( mockWorkflow );
			expect( workflowRegistry.detectWorkflow ).toHaveBeenCalledWith(
				'full site cleanup'
			);
		} );

		it( 'should route "check site performance" to workflow', () => {
			const mockWorkflow = {
				id: 'performance-check',
				label: 'Performance Check',
			};
			workflowRegistry.detectWorkflow.mockReturnValue( mockWorkflow );

			const result = route( 'check site performance' );

			expect( result.type ).toBe( 'workflow' );
			expect( result.workflow ).toBe( mockWorkflow );
		} );

		it( 'should route "maintenance" keyword alias to workflow', () => {
			const mockWorkflow = {
				id: 'site-cleanup',
				label: 'Full Site Cleanup',
			};
			workflowRegistry.detectWorkflow.mockReturnValue( mockWorkflow );

			const result = route( 'maintenance' );

			expect( result.type ).toBe( 'workflow' );
		} );

		it( 'should route "audit my plugins" to workflow', () => {
			const mockWorkflow = { id: 'plugin-audit', label: 'Plugin Audit' };
			workflowRegistry.detectWorkflow.mockReturnValue( mockWorkflow );

			const result = route( 'audit my plugins' );

			expect( result.type ).toBe( 'workflow' );
		} );

		it( 'should use isWorkflowQuery utility', () => {
			workflowRegistry.detectWorkflow.mockReturnValue( { id: 'test' } );
			expect( isWorkflowQuery( 'full cleanup' ) ).toBe( true );

			workflowRegistry.detectWorkflow.mockReturnValue( null );
			expect( isWorkflowQuery( 'list plugins' ) ).toBe( false );
		} );
	} );

	describe( 'ReAct Routing (Default)', () => {
		beforeEach( () => {
			workflowRegistry.detectWorkflow.mockReturnValue( null );
		} );

		it( 'should route action queries to ReAct mode', () => {
			expect( route( 'list plugins' ).type ).toBe( 'react' );
			expect( route( 'check site health' ).type ).toBe( 'react' );
			expect( route( 'flush cache' ).type ).toBe( 'react' );
			expect( route( 'show error log' ).type ).toBe( 'react' );
		} );

		it( 'should route questions to ReAct mode', () => {
			expect( route( 'what is a transient?' ).type ).toBe( 'react' );
			expect( route( 'how do I install a plugin?' ).type ).toBe(
				'react'
			);
			expect( route( 'why is my site slow?' ).type ).toBe( 'react' );
			expect( route( 'explain what transients are' ).type ).toBe(
				'react'
			);
		} );

		it( 'should route vague queries to ReAct mode', () => {
			expect( route( 'my site is slow' ).type ).toBe( 'react' );
			expect( route( 'something is broken' ).type ).toBe( 'react' );
			expect( route( 'how many plugins do I have?' ).type ).toBe(
				'react'
			);
		} );

		it( 'should route multi-action queries to ReAct mode', () => {
			expect( route( 'check my site and optimize if needed' ).type ).toBe(
				'react'
			);
			expect(
				route( 'show errors and deactivate broken plugin' ).type
			).toBe( 'react' );
			expect(
				route( 'clean up database and check health after' ).type
			).toBe( 'react' );
		} );
	} );

	describe( 'Edge Cases', () => {
		it( 'should handle null/undefined messages', () => {
			expect( route( null ).type ).toBe( 'react' );
			expect( route( undefined ).type ).toBe( 'react' );
			expect( route( '' ).type ).toBe( 'react' );
		} );

		it( 'should handle non-string messages', () => {
			expect( route( 123 ).type ).toBe( 'react' );
			expect( route( {} ).type ).toBe( 'react' );
		} );

		it( 'should route questions with workflow keywords to workflow', () => {
			// Workflow detection takes priority — if a workflow matches, use it
			const mockWorkflow = { id: 'plugin-audit', label: 'Plugin Audit' };
			workflowRegistry.detectWorkflow.mockReturnValue( mockWorkflow );

			expect( route( 'what is a plugin audit?' ).type ).toBe(
				'workflow'
			);
		} );
	} );

	describe( 'Real-World Test Cases from Manual Testing', () => {
		beforeEach( () => {
			workflowRegistry.detectWorkflow.mockReturnValue( null );
		} );

		it( 'should handle "list plugins" → ReAct', () => {
			expect( route( 'list plugins' ).type ).toBe( 'react' );
		} );

		it( 'should handle "my site is slow" → ReAct', () => {
			expect( route( 'my site is slow' ).type ).toBe( 'react' );
		} );

		it( 'should handle "what is a transient?" → ReAct', () => {
			expect( route( 'what is a transient?' ).type ).toBe( 'react' );
		} );

		it( 'should handle "why is my site so slow?" → ReAct', () => {
			expect( route( 'why is my site so slow?' ).type ).toBe( 'react' );
		} );

		it( 'should handle "full site cleanup" → Workflow', () => {
			const mockWorkflow = { id: 'site-cleanup' };
			workflowRegistry.detectWorkflow.mockReturnValue( mockWorkflow );
			expect( route( 'full site cleanup' ).type ).toBe( 'workflow' );
		} );

		it( 'should handle "show error log" → ReAct', () => {
			expect( route( 'show error log' ).type ).toBe( 'react' );
		} );

		it( 'should handle "check site health" → ReAct', () => {
			expect( route( 'check site health' ).type ).toBe( 'react' );
		} );

		it( 'should handle "flush cache" → ReAct', () => {
			expect( route( 'flush cache' ).type ).toBe( 'react' );
		} );

		it( 'should handle "something is broken" → ReAct', () => {
			expect( route( 'something is broken' ).type ).toBe( 'react' );
		} );

		it( 'should handle "how many plugins do I have?" → ReAct', () => {
			expect( route( 'how many plugins do I have?' ).type ).toBe(
				'react'
			);
		} );

		it( 'should handle "I\'m getting a white screen" → ReAct', () => {
			expect( route( "I'm getting a white screen" ).type ).toBe(
				'react'
			);
		} );

		it( 'should handle "how many rewrite rules do I have?" → ReAct', () => {
			expect( route( 'how many rewrite rules do I have?' ).type ).toBe(
				'react'
			);
		} );
	} );
} );
