/**
 * Custom Webpack Configuration for WP Agentic Admin
 *
 * Extends the default @wordpress/scripts config to add:
 * - Service Worker as a separate entry point (no chunking, self-contained)
 *
 * @package
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

// BUILD_TARGET=test-harness builds only the test harness bundle
const isTestHarness = process.env.BUILD_TARGET === 'test-harness';

const mainConfig = {
	...defaultConfig,

	entry: {
		// Main application bundle
		index: path.resolve( __dirname, 'src/extensions/index.js' ),

		// Service Worker - needs to be a self-contained bundle
		sw: {
			import: path.resolve( __dirname, 'src/extensions/sw.js' ),
			filename: 'sw.js', // Output as sw.js directly, not sw.index.js
		},
	},

	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build-extensions' ),
	},

	// Service Worker specific optimizations
	optimization: {
		...defaultConfig.optimization,
		// Prevent code splitting for SW - it needs to be self-contained
		splitChunks: {
			...defaultConfig.optimization?.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization?.splitChunks?.cacheGroups,
				// Don't split the service worker
				sw: false,
			},
		},
		runtimeChunk: false, // SW needs runtime included
	},
};

const testHarnessConfig = {
	...defaultConfig,

	entry: {
		'test-harness': path.resolve(
			__dirname,
			'src/extensions/test-harness.js'
		),
	},

	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build-test-harness' ),
	},
};

module.exports = isTestHarness ? testHarnessConfig : mainConfig;
