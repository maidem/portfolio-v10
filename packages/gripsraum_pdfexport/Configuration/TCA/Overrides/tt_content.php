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

// Define the 3 custom columns
$GLOBALS['TCA']['tt_content']['columns']['gripsraum_pdfexport_info_label'] = [
    'label' => 'Kachel „Info": Kategorie-Label (z. B. Vitals)',
    'config' => [
        'type'    => 'input',
        'size'    => 30,
        'eval'    => 'trim',
        'default' => 'Vitals',
    ],
];
$GLOBALS['TCA']['tt_content']['columns']['gripsraum_pdfexport_tech_label'] = [
    'label' => 'Kachel „Skills": Kategorie-Label (z. B. Stack)',
    'config' => [
        'type'    => 'input',
        'size'    => 30,
        'eval'    => 'trim',
        'default' => 'Stack',
    ],
];
$GLOBALS['TCA']['tt_content']['columns']['gripsraum_pdfexport_tech_title'] = [
    'label' => 'Kachel „Skills": Titel (z. B. Skills)',
    'config' => [
        'type'    => 'input',
        'size'    => 30,
        'eval'    => 'trim',
        'default' => 'Skills',
    ],
];

// Define which fields are shown in the backend form for this CType
$GLOBALS['TCA']['tt_content']['types']['gripsraum_pdfexport'] = [
    'showitem' => '
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:general,
            --palette--;;general,
            --palette--;;headers,
            bodytext;Description,
            subtitle;Button-Beschriftung (z. B. PDF ERSTELLEN),
            section_anchor,
        --div--;Kachel-Beschriftungen,
            gripsraum_pdfexport_info_label,
            gripsraum_pdfexport_tech_label,
            gripsraum_pdfexport_tech_title,
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
