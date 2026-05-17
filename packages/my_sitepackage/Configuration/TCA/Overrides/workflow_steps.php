<?php

declare(strict_types=1);

/**
 * TCA override for the workflow_steps inline table.
 *
 * Changes step_name from a plain text input to a select field whose items
 * are dynamically built from the gripsraum_skills_skill_collections table.
 * Editors can pick an existing skill name instead of typing it manually.
 *
 * The stored value is the skill_name string (not a UID), so the Fluid
 * template and frontend JS need no changes.
 */
$GLOBALS['TCA']['workflow_steps']['columns']['step_name']['config'] = [
    'type' => 'select',
    'renderType' => 'selectSingle',
    'items' => [
        ['label' => '', 'value' => ''],
    ],
    'itemsProcFunc' => \Gripsraum\MySitepackage\Form\SkillNameItemProvider::class . '->getItems',
    'default' => '',
];
