<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\Form;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Provides select items for the skill_category field.
 *
 * Reads all active category names from the gripsraum_skills_skill_categories
 * table (managed by the editor in the Skills content element) and returns
 * them as select items. The value stored is the category name itself (not a
 * UID), so the frontend template and filter JS need no changes.
 */
final class SkillCategoryItemProvider
{
    public function getItems(array &$params): void
    {
        $qb = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('gripsraum_skills_skill_categories');

        $categories = $qb
            ->select('category_name')
            ->from('gripsraum_skills_skill_categories')
            ->where(
                $qb->expr()->eq('deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\Types\Types::INTEGER)),
                $qb->expr()->eq('hidden', $qb->createNamedParameter(0, \Doctrine\DBAL\Types\Types::INTEGER)),
                $qb->expr()->neq('category_name', $qb->createNamedParameter('')),
            )
            ->orderBy('sorting', 'ASC')
            ->executeQuery()
            ->fetchAllAssociative();

        foreach ($categories as $row) {
            $name = trim((string)$row['category_name']);
            if ($name === '') {
                continue;
            }
            $params['items'][] = [
                'label' => $name,
                'value' => $name,
            ];
        }
    }
}
