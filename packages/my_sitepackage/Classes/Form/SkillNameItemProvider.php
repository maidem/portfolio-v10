<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\Form;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Provides select items for the step_name field in workflow_steps.
 *
 * Reads all active skill names from the gripsraum_skills_skill_collections
 * table so editors can pick an existing skill instead of typing it manually.
 * The value stored is the skill_name string, keeping the frontend template
 * and JS unchanged.
 */
final class SkillNameItemProvider
{
    public function getItems(array &$params): void
    {
        $qb = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('gripsraum_skills_skill_collections');

        $rows = $qb
            ->select('skill_name')
            ->from('gripsraum_skills_skill_collections')
            ->where(
                $qb->expr()->eq('deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\Types\Types::INTEGER)),
                $qb->expr()->eq('hidden', $qb->createNamedParameter(0, \Doctrine\DBAL\Types\Types::INTEGER)),
                $qb->expr()->neq('skill_name', $qb->createNamedParameter(''))
            )
            ->orderBy('skill_name', 'ASC')
            ->executeQuery()
            ->fetchAllAssociative();

        $seen = [];
        foreach ($rows as $row) {
            $name = trim((string)$row['skill_name']);
            if ($name === '' || isset($seen[$name])) {
                continue;
            }
            $seen[$name] = true;
            $params['items'][] = [
                'label' => $name,
                'value' => $name,
            ];
        }
    }
}
