<?php

defined('TYPO3') or die('Access denied.');

// Add default RTE configuration
$GLOBALS['TYPO3_CONF_VARS']['RTE']['Presets']['my_sitepackage'] = 'EXT:my_sitepackage/Configuration/RTE/Default.yaml';

// Register form configuration (TYPO3 v14: must use addTypoScriptSetup for module context)
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTypoScriptSetup('
module.tx_form.settings.yamlConfigurations.1711642100 = EXT:my_sitepackage/Configuration/Yaml/FormSetup.yaml
');

// Inject mosparo credentials directly into the site-set TypoScript chain.
// This bypasses the YamlFileLoader %env()% resolution path, which we cannot
// reliably control (env vars are not always passed through to the request
// at the time settings.yaml is loaded). getenv() inside ext_localconf.php
// runs at framework boot when env vars are guaranteed to be available.
$mosparoEnv = [
    'publicServer' => getenv('MOSPARO_PUBLIC_SERVER'),
    'verifyServer' => getenv('MOSPARO_VERIFY_SERVER'),
    'uuid'         => getenv('MOSPARO_UUID'),
    'publicKey'    => getenv('MOSPARO_PUBLIC_KEY'),
    'privateKey'   => getenv('MOSPARO_PRIVATE_KEY'),
];
$mosparoTs = '';
foreach ($mosparoEnv as $key => $value) {
    if ($value !== false && $value !== '') {
        $mosparoTs .= "plugin.tx_mosparoform.settings.projects.default.$key = $value\n";
    }
}
if ($mosparoTs !== '') {
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTypoScriptSetup($mosparoTs);
}

// Register PDF Export Plugin
\TYPO3\CMS\Extbase\Utility\ExtensionUtility::configurePlugin(
    'MySitepackage',
    'PdfExport',
    [\Gripsraum\MySitepackage\Controller\PdfExportController::class => 'generate'],
    [\Gripsraum\MySitepackage\Controller\PdfExportController::class => 'generate']
);
