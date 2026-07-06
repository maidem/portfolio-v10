<?php

declare(strict_types=1);

namespace Maidem\PdfExport\DataProcessing;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Frontend\ContentObject\ContentObjectRenderer;
use TYPO3\CMS\Frontend\ContentObject\DataProcessorInterface;

/**
 * Fetches all EXT:news articles with their categories for the PDF export selection UI.
 * Groups tiles by category title (e.g. "Projekte", "Logbuch").
 */
class PdfExportDataProcessor implements DataProcessorInterface
{
    public function process(
        ContentObjectRenderer $cObj,
        array $contentObjectConfiguration,
        array $processorConfiguration,
        array $processedData
    ): array {
        // Fetch all news records; join with pages to determine type (project vs logbook)
        // by the page title (e.g. "Projekte" → project, "Logbuch" → logbook).
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('tx_news_domain_model_news');

        $newsItems = $queryBuilder
            ->select('n.uid', 'n.title', 'n.datetime')
            ->addSelectLiteral("COALESCE(p.title, '') AS page_title")
            ->from('tx_news_domain_model_news', 'n')
            ->leftJoin(
                'n',
                'pages',
                'p',
                $queryBuilder->expr()->and(
                    $queryBuilder->expr()->eq('p.uid', $queryBuilder->quoteIdentifier('n.pid')),
                    $queryBuilder->expr()->eq('p.deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
                )
            )
            ->where(
                $queryBuilder->expr()->eq('n.deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('n.hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('n.datetime', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

        // Classify each entry as "project" or "logbook" based on its parent page title
        foreach ($newsItems as &$item) {
            $pageTitle = strtolower(trim($item['page_title'] ?? ''));
            if (str_contains($pageTitle, 'projekt') || str_contains($pageTitle, 'project')) {
                $item['type']       = 'project';
                $item['tile_label'] = 'Projekt';
            } elseif (str_contains($pageTitle, 'logbuch') || str_contains($pageTitle, 'log')) {
                $item['type']       = 'logbook';
                $item['tile_label'] = 'Logbuch';
            } else {
                // Default: treat as logbook; show page title as label if available
                $item['type']       = 'logbook';
                $item['tile_label'] = $item['page_title'] ?: 'Eintrag';
            }
        }
        unset($item);

        $processedData['pdfLogbook'] = $newsItems;
        $processedData['pdfProjects'] = [];

        // Home/tech nav titles from site settings
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
