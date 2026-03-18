<?php

// This file is automatically included by TYPO3 in config/system/additional.php (modern)
// Map environment variables to TYPO3 configuration

// Map environment variables to TYPO3 configuration if they exist (Production/Coolify)
// We check for 'IS_DDEV' to avoid overriding DDEV's internal database connection
if (!getenv('IS_DDEV')) {
    $mysqlHost = getenv('MYSQL_HOST');
    $dbConfig = [
        'driver' => 'mysqli',
        'host' => '127.0.0.1',
        'port' => 3306,
        'user' => getenv('MYSQL_USER') ?: 'maidem',
        'password' => getenv('MYSQL_PASSWORD'),
        'dbname' => getenv('MYSQL_DATABASE') ?: 'default',
    ];

    if ($mysqlHost) {
        $dbUrl = parse_url($mysqlHost);
        if (isset($dbUrl['host'])) {
            $dbConfig['host'] = $dbUrl['host'];
            $dbConfig['port'] = $dbUrl['port'] ?? 3306;
            if (isset($dbUrl['user'])) $dbConfig['user'] = $dbUrl['user'];
            if (isset($dbUrl['pass'])) $dbConfig['password'] = $dbUrl['pass'];
            // Many Coolify MariaDBs use 'default' or the path from the URL
            if (isset($dbUrl['path']) && strlen(ltrim($dbUrl['path'], '/')) > 0) {
                $dbConfig['dbname'] = ltrim($dbUrl['path'], '/');
            }
        } else {
            $dbConfig['host'] = $mysqlHost;
        }
    }

    $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] = array_merge(
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] ?? [],
        $dbConfig
    );
}

// Ensure display errors is OFF in production but we log to var/log
if (getenv('TYPO3_CONTEXT') === 'Production') {
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['displayErrors'] = 0;
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask'] = '';
    
    // Reverse Proxy Configuration for Coolify/Traefik
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['reverseProxy_ips'] = '*';
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['reverseProxy_ssl'] = '*';
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['trustedHostsPattern'] = '.*';
    
    // Explicitly handle HTTPS detection from Reverse Proxy
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
        $_SERVER['HTTPS'] = 'on';
        $_SERVER['SERVER_PORT'] = 443;
    }

    $GLOBALS['TYPO3_CONF_VARS']['SYS']['cookieSecure'] = 2;
    $GLOBALS['TYPO3_CONF_VARS']['BE']['lockSSL'] = true;
}
