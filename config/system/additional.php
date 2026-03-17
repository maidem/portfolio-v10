<?php

// This file is automatically included by TYPO3 in config/system/additional.php (modern)
// Map environment variables to TYPO3 configuration

// Map environment variables to TYPO3 configuration if they exist (Production/Coolify)
// We check for 'IS_DDEV' to avoid overriding DDEV's internal database connection
if (!getenv('IS_DDEV')) {
    if (getenv('MYSQL_HOST')) {
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default']['host'] = getenv('MYSQL_HOST');
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
}

// Adjust GraphicsMagick/ImageMagick based on environment if necessary
if (getenv('TYPO3_CONTEXT') === 'Production') {
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['displayErrors'] = 0;
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask'] = '';
}
