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
    // Prefer TYPO3_DATABASE_* vars (set in docker-compose.yaml / Coolify env),
    // fall back to MYSQL_* vars (auto-injected by some Coolify MySQL service setups).
    $dbHost     = getenv('TYPO3_DATABASE_HOST')     ?: getenv('MYSQL_HOST')     ?: '127.0.0.1';
    $dbPort     = (int)(getenv('TYPO3_DATABASE_PORT')    ?: getenv('MYSQL_PORT')     ?: 3306);
    $dbUser     = getenv('TYPO3_DATABASE_USERNAME')  ?: getenv('MYSQL_USER')     ?: '';
    $dbPassword = getenv('TYPO3_DATABASE_PASSWORD')  ?: getenv('MYSQL_PASSWORD') ?: '';
    $dbName     = getenv('TYPO3_DATABASE_NAME')      ?: getenv('MYSQL_DATABASE') ?: '';

    $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] = array_merge(
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] ?? [],
        [
            'driver'        => 'mysqli',
            'host'          => $dbHost,
            'port'          => $dbPort,
            'user'          => $dbUser,
            'password'      => $dbPassword,
            'dbname'        => $dbName,
            'driverOptions' => [
                // Fail fast if the host is unreachable instead of hanging for minutes
                MYSQLI_OPT_CONNECT_TIMEOUT => 5,
            ],
        ]
    );
}

// 2. PRODUCTION HARDENING & PROXY SETTINGS
// Disable Vite dev server in all non-DDEV environments (prevent DDEV URL from
// being embedded in production pages when 'auto' mode is active).
if (!getenv('IS_DDEV_PROJECT')) {
    $GLOBALS['TYPO3_CONF_VARS']['EXTENSIONS']['vite_asset_collector']['useDevServer'] = '0';
}

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

    // MAIL: settings.php hardcodes DDEV's mailpit sendmail shim, which doesn't
    // exist in production. Override with real SMTP creds from env vars.
    $GLOBALS['TYPO3_CONF_VARS']['MAIL']['transport'] = 'smtp';
    $GLOBALS['TYPO3_CONF_VARS']['MAIL']['transport_smtp_server'] = getenv('TYPO3_SMTP_SERVER') ?: '';
    $GLOBALS['TYPO3_CONF_VARS']['MAIL']['transport_smtp_username'] = getenv('TYPO3_SMTP_USER') ?: '';
    $GLOBALS['TYPO3_CONF_VARS']['MAIL']['transport_smtp_password'] = getenv('TYPO3_SMTP_PASSWORD') ?: '';
    $GLOBALS['TYPO3_CONF_VARS']['MAIL']['transport_smtp_encrypt'] = getenv('TYPO3_SMTP_ENCRYPT') ?: 'tls';
}

// 3. CACHE HASH
// "contact=sent" is only a JS toast trigger after form submit, irrelevant for caching.
$GLOBALS['TYPO3_CONF_VARS']['FE']['cacheHash']['excludedParameters'][] = 'contact';

// 4. MOSPARO CREDENTIALS
// Loaded at runtime via %env()% placeholders in
// config/sites/main-site/settings.yaml — handled natively by TYPO3's
// YamlFileLoader (PROCESS_PLACEHOLDERS). No PHP injection needed here.
