<?php

declare(strict_types=1);

namespace Gripsraum\PdfExport\DataProcessing;

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
        // Fetch all news records with their first category title via JOIN
        $connection = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getConnectionForTable('tx_news_domain_model_news');

        $sql = <<<'SQL'
            SELECT
                n.uid,
                n.title,
                n.datetime,
                COALESCE(sc.title, 'News') AS category_title
            FROM tx_news_domain_model_news n
            LEFT JOIN sys_category_record_mm mm
                ON mm.uid_foreign = n.uid
                AND mm.tablenames = 'tx_news_domain_model_news'
                AND mm.fieldname = 'categories'
            LEFT JOIN sys_category sc ON sc.uid = mm.uid_local AND sc.deleted = 0
            WHERE n.deleted = 0 AND n.hidden = 0
            GROUP BY n.uid
            ORDER BY n.datetime DESC
        SQL;

        $newsItems = $connection->executeQuery($sql)->fetchAllAssociative();

        foreach ($newsItems as &$item) {
            $item['tile_label'] = $item['category_title'];
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
