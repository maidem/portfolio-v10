<?php

$EM_CONF['maidem_pdfexport'] = [
    'title' => 'Maidem PDF Export',
    'description' => 'PDF Export for the Portfolio. ContentBlock selection form + Extbase controller generates custom PDF summaries via headless Chromium (spatie/browsershot).',
    'category' => 'fe',
    'author' => 'Maik Demuth',
    'author_email' => '',
    'state' => 'beta',
    'version' => '1.0.0',
    'constraints' => [
        'depends' => [
            'php' => '8.4.0-0.0.0',
            'typo3' => '14.1.0-14.99.99',
            'extbase' => '14.1.0-14.99.99',
        ],
        'conflicts' => [],
        'suggests' => [
            'friendsoftypo3/content-blocks' => '',
        ],
    ],
];
