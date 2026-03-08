<?php
/**
 * Service Worker Loader
 *
 * Serves the compiled sw.js with the Service-Worker-Allowed header so the
 * browser permits registering the SW with scope '/wp-admin/' even though
 * the script lives under '/wp-content/plugins/...'.
 *
 * @package WPAgenticAdmin
 * @since   0.4.1
 */

// Allow the SW to control /wp-admin/ pages.
header( 'Service-Worker-Allowed: /wp-admin/' );
header( 'Content-Type: application/javascript' );

// Prevent caching so SW updates propagate immediately.
header( 'Cache-Control: no-cache, no-store, must-revalidate' );

readfile( __DIR__ . '/build-extensions/sw.js' );
exit;
