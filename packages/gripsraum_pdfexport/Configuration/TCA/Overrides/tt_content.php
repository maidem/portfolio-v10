<?php

declare(strict_types=1);

defined('TYPO3') or die('Access denied.');

// Register the gripsraum_pdfexport CType as a standard content element
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPlugin(
    [
        'label' => 'PDF Export',
        'value' => 'gripsraum_pdfexport',
        'icon'  => 'EXT:gripsraum_pdfexport/Resources/Public/Icons/pdfexport.svg',
        'group' => 'default',
    ],
    'CType'
);

// Define which fields are shown in the backend form for this CType
$GLOBALS['TCA']['tt_content']['types']['gripsraum_pdfexport'] = [
    'showitem' => '
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:general,
            --palette--;;general,
            --palette--;;headers,
            bodytext;Description,
            section_anchor,
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:access,
            --palette--;;hidden,
            --palette--;;access,
    ',
    'columnsOverrides' => [
        'bodytext' => [
            'config' => [
                'enableRichtext' => true,
            ],
        ],
    ],
];
