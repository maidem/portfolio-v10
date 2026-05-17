<?php

declare(strict_types=1);

/**
 * TCA override for the gripsraum_skills_skill_collections inline table.
 *
 * Changes skill_category from a plain text input to a select field whose
 * items are dynamically built from the gripsraum_skills_skill_categories
 * table (managed by the editor inside the Skills content element).
 *
 * The stored value is the category_name string (not a UID), so the Fluid
 * template and the frontend filter JS work without any changes.
 */
$GLOBALS['TCA']['gripsraum_skills_skill_collections']['columns']['skill_category']['config'] = [
    'type' => 'select',
    'renderType' => 'selectSingle',
    'items' => [
        ['label' => '', 'value' => ''],
    ],
    'itemsProcFunc' => \Gripsraum\MySitepackage\Form\SkillCategoryItemProvider::class . '->getItems',
    'default' => '',
];
