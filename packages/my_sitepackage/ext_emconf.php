<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'My SitePackage',
    'description' => '',
    'category' => 'templates',
    'constraints' => [
        'depends' => [
            'typo3' => '14.0.0-14.9.99',
            'php' => '8.4.0-8.4.99',
            'fluid_styled_content' => '14.0.0-14.9.99',
            'rte_ckeditor' => '14.0.0-14.9.99',
        ],
        'conflicts' => [
        ],
    ],
    'autoload' => [
        'psr-4' => [
            'Gripsraum\\MySitepackage\\' => 'Classes',
        ],
    ],
    'state' => 'stable',
    'uploadfolder' => 0,
    'createDirs' => '',
    'clearCacheOnLoad' => 1,
    'author' => 'Maik Demuth',
    'author_email' => 'hi@maidem.de',
    'author_company' => 'gripsraum',
    'version' => '1.0.0',
];
