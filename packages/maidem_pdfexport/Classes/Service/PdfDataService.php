<?php

declare(strict_types=1);

namespace Maidem\PdfExport\Service;

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

    /**
     * Contact data from the latest gripsraum_contactinfo element.
     */
    public function getContactContent(): array
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $row = $queryBuilder
            ->select(
                'gripsraum_contactinfo_contact_name AS contact_name',
                'gripsraum_contactinfo_address AS address',
                'gripsraum_contactinfo_email AS email',
                'gripsraum_contactinfo_phone AS phone'
            )
            ->from('tt_content')
            ->where(
                $queryBuilder->expr()->eq('CType', $queryBuilder->createNamedParameter('gripsraum_contactinfo')),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('uid', 'DESC')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();

        return $row ?: [];
    }

    /**
     * "My Story" text from the banner element (gripsraum_banner with bodytext).
     */
    public function getStoryContent(): array
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $row = $queryBuilder
            ->select('header', 'bodytext')
            ->from('tt_content')
            ->where(
                // banner + text-cta, beide tragen den Story-/Profiltext
                $queryBuilder->expr()->in('CType', $queryBuilder->createNamedParameter(['gripsraum_banner', 'gripsraum_textcta'], \Doctrine\DBAL\ArrayParameterType::STRING)),
                $queryBuilder->expr()->neq('bodytext', $queryBuilder->createNamedParameter('')),
                $queryBuilder->expr()->isNotNull('bodytext'),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('uid', 'DESC')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();

        return $row ?: [];
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
            ->getQueryBuilderForTable('gripsraum_skills_skills');

        $rows = $qb
            ->select('s.skill_name', 'c.category_name AS skill_category')
            ->from('gripsraum_skills_skills', 's')
            ->join('s', 'gripsraum_skills_skill_categories', 'c', 's.foreign_table_parent_uid = c.uid')
            ->where(
                $qb->expr()->eq('c.foreign_table_parent_uid', $qb->createNamedParameter($parent['uid'], \Doctrine\DBAL\ParameterType::INTEGER)),
                $qb->expr()->eq('s.deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qb->expr()->eq('c.deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qb->expr()->neq('s.skill_name', $qb->createNamedParameter(''))
            )
            ->orderBy('c.sorting')
            ->addOrderBy('s.sorting')
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

    public function getProjectsByUids(array $uids): array
    {
        if (empty($uids)) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_news_domain_model_news');
        $rows = $queryBuilder
            ->select('uid', 'title', 'teaser AS description', 'bodytext', 'datetime')
            ->from('tx_news_domain_model_news')
            ->where(
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->in('uid', array_map('intval', $uids))
            )
            ->executeQuery()
            ->fetchAllAssociative();

        return $this->sortByUidOrder($rows, $uids);
    }

    public function getLogbookByUids(array $uids): array
    {
        if (empty($uids)) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_news_domain_model_news');
        $rows = $queryBuilder
            ->select('uid', 'title AS header', 'teaser AS teaser_text', 'datetime AS project_date', 'bodytext')
            ->from('tx_news_domain_model_news')
            ->where(
                $queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->in('uid', array_map('intval', $uids))
            )
            ->executeQuery()
            ->fetchAllAssociative();

        return $this->sortByUidOrder($rows, $uids);
    }

    /** Sorts rows into the order of the given uid list (= user's cart order). */
    private function sortByUidOrder(array $rows, array $uids): array
    {
        $order = array_flip(array_map('intval', $uids));
        usort($rows, fn(array $a, array $b) => ($order[$a['uid']] ?? PHP_INT_MAX) <=> ($order[$b['uid']] ?? PHP_INT_MAX));
        return $rows;
    }

    /**
     * Returns the pdf-cart key for a news record: "project_{uid}" or "logbook_{uid}".
     * Classification is based on the parent page title, same logic as PdfExportDataProcessor.
     */
    public function classifyNewsUid(int $uid): string
    {
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('tx_news_domain_model_news');

        $row = $queryBuilder
            ->select('n.uid')
            ->addSelectLiteral("COALESCE(p.title, '') AS page_title")
            ->from('tx_news_domain_model_news', 'n')
            ->leftJoin('n', 'pages', 'p', $queryBuilder->expr()->eq('p.uid', $queryBuilder->quoteIdentifier('n.pid')))
            ->where($queryBuilder->expr()->eq('n.uid', $queryBuilder->createNamedParameter($uid, \Doctrine\DBAL\ParameterType::INTEGER)))
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();

        if (!$row) {
            return 'logbook_' . $uid;
        }

        $pageTitle = strtolower(trim($row['page_title'] ?? ''));
        $type = (str_contains($pageTitle, 'projekt') || str_contains($pageTitle, 'project'))
            ? 'project'
            : 'logbook';

        return $type . '_' . $uid;
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
