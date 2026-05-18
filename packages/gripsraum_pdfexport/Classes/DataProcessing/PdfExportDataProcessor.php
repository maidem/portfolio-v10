<?php

declare(strict_types=1);

namespace Gripsraum\PdfExport\DataProcessing;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Frontend\ContentObject\ContentObjectRenderer;
use TYPO3\CMS\Frontend\ContentObject\DataProcessorInterface;

/**
 * Fetches all project items and logbook entries for the PDF export selection UI.
 * Queries without page-ID restriction so all records are found regardless of storage page.
 */
class PdfExportDataProcessor implements DataProcessorInterface
{
    public function process(
        ContentObjectRenderer $cObj,
        array $contentObjectConfiguration,
        array $processorConfiguration,
        array $processedData
    ): array {
        $qbProjects = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('gripsraum_projects_project_items');
        $qbProjects->getRestrictions()->removeAll();
        $processedData['pdfProjects'] = $qbProjects
            ->select('uid', 'title')
            ->from('gripsraum_projects_project_items')
            ->where(
                $qbProjects->expr()->eq('deleted', $qbProjects->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qbProjects->expr()->eq('hidden', $qbProjects->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();

        $qbLogbook = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('tt_content');
        $qbLogbook->getRestrictions()->removeAll();
        $logbookEntries = $qbLogbook
            ->select('tc.uid', 'tc.header', 'tc.gripsraum_newsarticle_project_date')
            ->from('tt_content', 'tc')
            ->where(
                $qbLogbook->expr()->eq('tc.CType', $qbLogbook->createNamedParameter('gripsraum_newsarticle')),
                $qbLogbook->expr()->eq('tc.hidden', $qbLogbook->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qbLogbook->expr()->eq('tc.deleted', $qbLogbook->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('tc.gripsraum_newsarticle_project_date', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

        $qbProjectArticles = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('tt_content');
        $qbProjectArticles->getRestrictions()->removeAll();
        $projectArticleEntries = $qbProjectArticles
            ->select('tc.uid', 'tc.header', 'tc.gripsraum_newsarticle_project_date')
            ->from('tt_content', 'tc')
            ->where(
                $qbProjectArticles->expr()->eq('tc.CType', $qbProjectArticles->createNamedParameter('gripsraum_projectarticle')),
                $qbProjectArticles->expr()->eq('tc.hidden', $qbProjectArticles->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qbProjectArticles->expr()->eq('tc.deleted', $qbProjectArticles->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('tc.gripsraum_newsarticle_project_date', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

        $projectsLabel = ($processedData['data']['gripsraum_pdfexport_projects_label'] ?? '') ?: 'Projekte';
        $logbookLabel  = ($processedData['data']['gripsraum_pdfexport_logbook_label'] ?? '') ?: 'Logbuch';
        $processedData['projectsLabel'] = $projectsLabel;

        foreach ($logbookEntries as &$entry) {
            $entry['tile_label'] = $logbookLabel;
        }
        unset($entry);

        foreach ($projectArticleEntries as &$entry) {
            $entry['tile_label'] = $projectsLabel;
        }
        unset($entry);

        // Merge: project articles first, then logbook entries
        $processedData['pdfLogbook'] = array_merge($projectArticleEntries, $logbookEntries);

        // Home/tech nav titles from site settings (mirrors the nav's {settings.nav.*})
        $site = $cObj->getRequest()->getAttribute('site');
        if ($site !== null) {
            $siteSettings = $site->getSettings();
            $processedData['homeNavTitle'] = $siteSettings->get('nav.homeTitle') ?: 'Kurzprofil';
            $processedData['techNavTitle'] = $siteSettings->get('nav.techTitle') ?: 'Skills';
        } else {
            $processedData['homeNavTitle'] = 'Kurzprofil';
            $processedData['techNavTitle'] = 'Skills';
        }

        return $processedData;
    }
}
