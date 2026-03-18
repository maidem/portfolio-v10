<?php

// This file is automatically included by TYPO3 in config/system/additional.php (modern)
// Map environment variables to TYPO3 configuration

// Map environment variables to TYPO3 configuration if they exist (Production/Coolify)
// We check for 'IS_DDEV' to avoid overriding DDEV's internal database connection
if (!getenv('IS_DDEV')) {
    $mysqlHost = getenv('MYSQL_HOST');
    if ($mysqlHost) {
        // Coolify sometimes provides a full URL like mysql://user:pass@host:port/db
        $dbUrl = parse_url($mysqlHost);
        if (isset($dbUrl['host'])) {
            $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['host'] = $dbUrl['host'];
            $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['port'] = $dbUrl['port'] ?? 3306;
            
            // If the URL has user/pass/path, use them as fallbacks
            if (isset($dbUrl['user']) && !getenv('MYSQL_USER')) {
                $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['user'] = $dbUrl['user'];
            }
            if (isset($dbUrl['pass']) && !getenv('MYSQL_PASSWORD')) {
                $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['password'] = $dbUrl['pass'];
            }
            if (isset($dbUrl['path']) && !getenv('MYSQL_DATABASE')) {
                $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['dbname'] = ltrim($dbUrl['path'], '/');
            }
        } else {
            $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['host'] = $mysqlHost;
        }
    }
    if (getenv('MYSQL_DATABASE')) {
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['dbname'] = getenv('MYSQL_DATABASE');
    }
    if (getenv('MYSQL_USER')) {
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['user'] = getenv('MYSQL_USER');
    }
    if (getenv('MYSQL_PASSWORD')) {
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['password'] = getenv('MYSQL_PASSWORD');
    }
    $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['driver'] = 'mysqli';
}

// Adjust GraphicsMagick/ImageMagick based on environment if necessary
if (getenv('TYPO3_CONTEXT') === 'Production') {
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['displayErrors'] = 0;
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask'] = '';
}
