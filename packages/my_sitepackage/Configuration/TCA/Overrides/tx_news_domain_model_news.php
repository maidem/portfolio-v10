<?php
defined('TYPO3') or die();

use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

// ponytail: eine Text-Spalte mit JSON reicht – kein IRRE, kein eigenes Model
$tempColumns = [
    'tx_mysitepackage_metro' => [
        'exclude' => true,
        'label' => 'LLL:EXT:my_sitepackage/Resources/Private/Language/locallang.xlf:metro.label',
        'description' => 'LLL:EXT:my_sitepackage/Resources/Private/Language/locallang.xlf:metro.description',
        'config' => [
            'type' => 'text',
            'cols' => 60,
            'rows' => 10,
            'placeholder' => '{"lines":[{"color":"#1c8a7d","stations":["Start","...","Ende"]}]}',
        ],
    ],
];

ExtensionManagementUtility::addTCAcolumns('tx_news_domain_model_news', $tempColumns);
ExtensionManagementUtility::addToAllTCAtypes(
    'tx_news_domain_model_news',
    '--div--;Metro-Grafik,tx_mysitepackage_metro'
);
