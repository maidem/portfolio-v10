<?php

declare(strict_types=1);

defined('TYPO3') or die('Access denied.');

\TYPO3\CMS\Extbase\Utility\ExtensionUtility::configurePlugin(
    'PdfExport',
    'PdfExport',
    [\Maidem\PdfExport\Controller\PdfExportController::class => 'generate'],
    [\Maidem\PdfExport\Controller\PdfExportController::class => 'generate']
);
