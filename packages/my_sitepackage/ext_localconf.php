<?php

defined('TYPO3') or die('Access denied.');

// Add default RTE configuration
$GLOBALS['TYPO3_CONF_VARS']['RTE']['Presets']['my_sitepackage'] = 'EXT:my_sitepackage/Configuration/RTE/Default.yaml';

// Register form configuration (TYPO3 v14: must use addTypoScriptSetup for module context)
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTypoScriptSetup('
module.tx_form.settings.yamlConfigurations.1711642100 = EXT:my_sitepackage/Configuration/Yaml/FormSetup.yaml
');

// Register PDF Export Plugin
\TYPO3\CMS\Extbase\Utility\ExtensionUtility::configurePlugin(
    'MySitepackage',
    'PdfExport',
    [\Gripsraum\MySitepackage\Controller\PdfExportController::class => 'generate'],
    [\Gripsraum\MySitepackage\Controller\PdfExportController::class => 'generate']
);
