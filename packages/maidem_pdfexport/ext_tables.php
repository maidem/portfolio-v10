<?php

declare(strict_types=1);

defined('TYPO3') or die('Access denied.');

$iconRegistry = \TYPO3\CMS\Core\Utility\GeneralUtility::makeInstance(
    \TYPO3\CMS\Core\Imaging\IconRegistry::class
);
$iconRegistry->registerIcon(
    'gripsraum-pdfexport',
    \TYPO3\CMS\Core\Imaging\IconProvider\SvgIconProvider::class,
    ['source' => 'EXT:gripsraum_pdfexport/Resources/Public/Icons/pdfexport.svg']
);
