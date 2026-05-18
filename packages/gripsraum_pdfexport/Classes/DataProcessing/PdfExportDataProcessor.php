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
        $processedData['pdfLogbook'] = $qbLogbook
            ->select('tc.uid', 'tc.header', 'tc.gripsraum_newsarticle_project_date', 'p.slug as page_slug')
            ->from('tt_content', 'tc')
            ->leftJoin('tc', 'pages', 'p', 'tc.pid = p.uid')
            ->where(
                $qbLogbook->expr()->eq('tc.CType', $qbLogbook->createNamedParameter('gripsraum_newsarticle')),
                $qbLogbook->expr()->eq('tc.hidden', $qbLogbook->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $qbLogbook->expr()->eq('tc.deleted', $qbLogbook->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('tc.gripsraum_newsarticle_project_date', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

        foreach ($processedData['pdfLogbook'] as &$entry) {
            $slug = $entry['page_slug'] ?? '';
            $entry['tile_label'] = (str_contains($slug, 'projekte')) ? 'Projekte' : 'Logbuch';
        }
        unset($entry);

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
