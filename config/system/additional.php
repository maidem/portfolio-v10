<?php

/**
 * TYPO3 TEMPLATE CONFIGURATION (v14 / Coolify / DDEV)
 * --------------------------------------------------
 * This file is automatically loaded by TYPO3 to override or extend LocalConfiguration.php.
 * It ensures the project runs seamlessly in local (DDEV) and production (Coolify/Docker) environments.
 */

// 0. GLOBAL TRUSTED HOSTS (Permit DDEV and custom domains)
$GLOBALS['TYPO3_CONF_VARS']['SYS']['trustedHostsPattern'] = '.*';

// 1. DATABASE CONFIGURATION (Production only)
// We skip this in DDEV to let DDEV handle its internal connection.
if (!getenv('IS_DDEV_PROJECT')) {
    $mysqlHost = getenv('MYSQL_HOST');
    
    // Default fallback values (Edit as needed for your base stack)
    $dbConfig = [
        'driver' => 'mysqli',
        'host' => '127.0.0.1',
        'port' => 3306,
        'user' => getenv('MYSQL_USER') ?: 'maidem',
        'password' => getenv('MYSQL_PASSWORD'),
        'dbname' => getenv('MYSQL_DATABASE') ?: 'default',
    ];

    if ($mysqlHost) {
        // Coolify/Traefik often provides a DSN string (mysql://user:pass@host:port/dbname)
        $dbUrl = parse_url($mysqlHost);
        if (isset($dbUrl['host'])) {
            $dbConfig['host'] = $dbUrl['host'];
            $dbConfig['port'] = $dbUrl['port'] ?? 3306;
            
            // Extract user/pass/path from DSN if provided
            if (isset($dbUrl['user'])) $dbConfig['user'] = $dbUrl['user'];
            if (isset($dbUrl['pass'])) $dbConfig['password'] = $dbUrl['pass'];
            if (isset($dbUrl['path']) && strlen(ltrim($dbUrl['path'], '/')) > 0) {
                $dbConfig['dbname'] = ltrim($dbUrl['path'], '/');
            }
        } else {
            // Simple hostname provided
            $dbConfig['host'] = $mysqlHost;
        }
    }

    // Merge our dynamically detected config into TYPO3 globals
    $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] = array_merge(
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] ?? [],
        $dbConfig
    );
}

// 2. PRODUCTION HARDENING & PROXY SETTINGS
if (getenv('TYPO3_CONTEXT') === 'Production') {
    // Disable detailed error messages for users
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['displayErrors'] = 0;
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask'] = '';
    
    // REVERSE PROXY SUPPORT (Traefik/Cloudflare/Nginx)
    // Critical: Fixes redirect loops and backend login issues ("Missing referrer")
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['reverseProxy_ips'] = '*'; // Trust the incoming proxy IP
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['reverseProxy_ssl'] = '*'; // Trust SSL termination by proxy
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['trustedHostsPattern'] = '.*'; // Allow matching for production domain
    
    // Explicit HTTPS Detection: Signals PHP/TYPO3 we are on SSL even if internal port is 80 (HTTP)
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
        $_SERVER['HTTPS'] = 'on';
        $_SERVER['SERVER_PORT'] = 443;
    }

    // Security: Only send Cookies over HTTPS
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['cookieSecure'] = 2; // Always secure
    $GLOBALS['TYPO3_CONF_VARS']['BE']['lockSSL'] = true; // Force SSL for backend
}
