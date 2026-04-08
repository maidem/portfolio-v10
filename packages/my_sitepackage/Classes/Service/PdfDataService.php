<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\Service;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Service to fetch data for the PDF Export from the database.
 */
class PdfDataService
{
    /**
     * Fetches the latest "About" content from the FAQ element.
     */
    public function getAboutContent(): string
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $row = $queryBuilder
            ->select('bodytext')
            ->from('tt_content')
            ->where(
                $queryBuilder->expr()->eq('CType', $queryBuilder->createNamedParameter('gripsraum_faq')),
                $queryBuilder->expr()->neq('bodytext', $queryBuilder->createNamedParameter('')),
                $queryBuilder->expr()->isNotNull('bodytext'),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('uid', 'DESC')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();

        return $row['bodytext'] ?? '';
    }

    /**
     * Fetches the FAQ items.
     */
    public function getFaqContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_faq');
        if (!$parent) return [];

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('gripsraum_faq_faq_items');
        return $queryBuilder
            ->select('question', 'answer')
            ->from('gripsraum_faq_faq_items')
            ->where($queryBuilder->expr()->eq('foreign_table_parent_uid', $queryBuilder->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)))
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    /**
     * Fetches the Technologies/Skills.
     */
    public function getTechContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_skills');
        if (!$parent) return [];

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('gripsraum_skills_skill_collections');
        return $queryBuilder
            ->select('section_title', 'skills_list')
            ->from('gripsraum_skills_skill_collections')
            ->where($queryBuilder->expr()->eq('foreign_table_parent_uid', $queryBuilder->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)))
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    /**
     * Fetches the Projects.
     */
    public function getProjectsContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_projects');
        if (!$parent) return [];

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('gripsraum_projects_project_items');
        return $queryBuilder
            ->select('title', 'description')
            ->from('gripsraum_projects_project_items')
            ->where($queryBuilder->expr()->eq('foreign_table_parent_uid', $queryBuilder->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)))
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    /**
     * Helper to get the latest tt_content record for a CType.
     */
    private function getLatestContentRecord(string $ctype): ?array
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $row = $queryBuilder
            ->select('uid')
            ->from('tt_content')
            ->where(
                $queryBuilder->expr()->eq('CType', $queryBuilder->createNamedParameter($ctype)),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('uid', 'DESC')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();
            
        return $row ?: null;
    }
}
