<?php

defined('TYPO3') or die('Access denied.');

// Add default RTE configuration
$GLOBALS['TYPO3_CONF_VARS']['RTE']['Presets']['my_sitepackage'] = 'EXT:my_sitepackage/Configuration/RTE/Default.yaml';

// Register form configuration (TYPO3 v14: must use addTypoScriptSetup for module context)
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTypoScriptSetup('
module.tx_form.settings.yamlConfigurations.1711642100 = EXT:my_sitepackage/Configuration/Yaml/FormSetup.yaml
');

// Use the frontend favicon for the whole backend (incl. login)
$GLOBALS['TYPO3_CONF_VARS']['EXTENSIONS']['backend']['backendFavicon'] = 'EXT:my_sitepackage/Resources/Public/Icons/favicon.svg';

// Replace the TYPO3 logo above the login form with the project logo
$GLOBALS['TYPO3_CONF_VARS']['EXTENSIONS']['backend']['loginLogo'] = 'fileadmin/logos/typo3-black-1200px-transparent.png';
