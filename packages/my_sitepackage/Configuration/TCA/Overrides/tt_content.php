<?php
defined('TYPO3') or die();

use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

$additionalColumns = [
    'section_anchor' => [
        'exclude' => false,
        'label' => 'LLL:EXT:my_sitepackage/Resources/Private/Language/locallang.xlf:anchor_id.label',
        'description' => 'LLL:EXT:my_sitepackage/Resources/Private/Language/locallang.xlf:anchor_id.description',
        'config' => [
            'type' => 'input',
            'size' => 30,
            'eval' => 'trim,alphanum_x,nospace',
            'placeholder' => 'e.g. projects',
        ],
    ],
];

ExtensionManagementUtility::addTCAcolumns('tt_content', $additionalColumns);

// Add to the standard "Appearance" palette for ALL elements (including Form)
ExtensionManagementUtility::addFieldsToPalette(
    'tt_content',
    'appearance',
    '--linebreak--,section_anchor',
    'after:sectionIndex'
);

// EXT:form (form_formframework) does not include the appearance palette by default,
// so we explicitly add the field to that CType's showitem.
$GLOBALS['TCA']['tt_content']['types']['form_formframework']['showitem'] .= ',section_anchor';

// TYPO3 v14-safe fallback: explicitly place field on form CType edit form.
ExtensionManagementUtility::addToAllTCAtypes(
    'tt_content',
    '--linebreak--,section_anchor',
    'form_formframework',
    'after:subheader'
);

// Keep header value for custom rendering, but hide default CE header output
// by default for form content elements (header_layout=100).
$GLOBALS['TCA']['tt_content']['types']['form_formframework']['columnsOverrides']['header_layout']['config']['default'] = 100;
