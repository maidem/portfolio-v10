<?php

declare(strict_types=1);

namespace Gripsraum\PdfExport\Service;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Service to fetch data for the PDF Export from the database.
 */
class PdfDataService
{
    public function getAboutContent(int $homePid = 0): string
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $queryBuilder
            ->select('bodytext')
            ->from('tt_content')
            ->where(
                $queryBuilder->expr()->eq('CType', $queryBuilder->createNamedParameter('gripsraum_hero')),
                $queryBuilder->expr()->neq('bodytext', $queryBuilder->createNamedParameter('')),
                $queryBuilder->expr()->isNotNull('bodytext'),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            );

        if ($homePid > 0) {
            $queryBuilder->andWhere(
                $queryBuilder->expr()->eq('pid', $queryBuilder->createNamedParameter($homePid, \Doctrine\DBAL\ParameterType::INTEGER))
            );
        }

        $row = $queryBuilder
            ->orderBy('uid', 'DESC')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();

        return $row['bodytext'] ?? '';
    }

    public function getFaqContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_faq');
        if (!$parent) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('gripsraum_faq_faq_items');
        $items = $queryBuilder
            ->select('question', 'answer')
            ->from('gripsraum_faq_faq_items')
            ->where($queryBuilder->expr()->eq('foreign_table_parent_uid', $queryBuilder->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)))
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();

        return [
            'header' => $parent['header'] ?? 'FAQ',
            'items' => $items,
        ];
    }

    public function getTechContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_skills');
        if (!$parent) {
            return [];
        }

        $qb = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('gripsraum_skills_skill_collections');

        $rows = $qb
            ->select('skill_name', 'skill_category')
            ->from('gripsraum_skills_skill_collections')
            ->where(
                $qb->expr()->eq('foreign_table_parent_uid', $qb->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)),
                $qb->expr()->eq('deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qb->expr()->neq('skill_name', $qb->createNamedParameter(''))
            )
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();

        // Group skill names by category
        $grouped = [];
        foreach ($rows as $row) {
            $cat  = trim((string)($row['skill_category'] ?? ''));
            $name = trim((string)($row['skill_name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $grouped[$cat][] = $name;
        }

        return $grouped;
    }

    public function getWorkflowsContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_skills');
        if (!$parent) {
            return [];
        }

        $qb = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('gripsraum_skills_skill_workflows');

        $workflows = $qb
            ->select('uid', 'workflow_name')
            ->from('gripsraum_skills_skill_workflows')
            ->where(
                $qb->expr()->eq('foreign_table_parent_uid', $qb->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)),
                $qb->expr()->eq('deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();

        foreach ($workflows as &$workflow) {
            $sq = GeneralUtility::makeInstance(ConnectionPool::class)
                ->getQueryBuilderForTable('workflow_steps');

            $steps = $sq
                ->select('step_name')
                ->from('workflow_steps')
                ->where(
                    $sq->expr()->eq('foreign_table_parent_uid', $sq->createNamedParameter((int)$workflow['uid'], \Doctrine\DBAL\ParameterType::INTEGER)),
                    $sq->expr()->eq('deleted', $sq->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                    $sq->expr()->neq('step_name', $sq->createNamedParameter(''))
                )
                ->orderBy('sorting')
                ->executeQuery()
                ->fetchAllAssociative();

            $workflow['steps'] = array_column($steps, 'step_name');
        }
        unset($workflow);

        return $workflows;
    }

    public function getProjectsByUids(array $uids): array
    {
        if (empty($uids)) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_news_domain_model_news');
        return $queryBuilder
            ->select('uid', 'title', 'teaser AS description', 'datetime')
            ->from('tx_news_domain_model_news')
            ->where(
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->in('uid', array_map('intval', $uids))
            )
            ->orderBy('datetime', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    public function getLogbookByUids(array $uids): array
    {
        if (empty($uids)) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_news_domain_model_news');
        return $queryBuilder
            ->select('uid', 'title AS header', 'teaser AS teaser_text', 'datetime AS project_date', 'bodytext')
            ->from('tx_news_domain_model_news')
            ->where(
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->in('uid', array_map('intval', $uids))
            )
            ->orderBy('datetime', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    public function getProjectsContent(): array
    {
        $parent = $this->getLatestContentRecord('gripsraum_projects');
        if (!$parent) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('gripsraum_projects_project_items');
        return $queryBuilder
            ->select('title', 'description')
            ->from('gripsraum_projects_project_items')
            ->where($queryBuilder->expr()->eq('foreign_table_parent_uid', $queryBuilder->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)))
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    public function getLogbookContent(): array
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        return $queryBuilder
            ->select('header', 'gripsraum_newsarticle_teaser_text as teaser_text', 'gripsraum_newsarticle_project_date as project_date', 'bodytext')
            ->from('tt_content')
            ->where(
                $queryBuilder->expr()->eq('CType', $queryBuilder->createNamedParameter('gripsraum_newsarticle')),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('gripsraum_newsarticle_project_date', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();
    }

    private function getLatestContentRecord(string $ctype): ?array
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $row = $queryBuilder
            ->select('uid', 'header')
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
