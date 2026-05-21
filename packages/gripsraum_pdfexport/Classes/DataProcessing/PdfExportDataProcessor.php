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
        // Fetch all news records with their first category title via QueryBuilder JOIN
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('tx_news_domain_model_news');

        $newsItems = $queryBuilder
            ->select('n.uid', 'n.title', 'n.datetime')
            ->addSelectLiteral("COALESCE(sc.title, 'News') AS category_title")
            ->from('tx_news_domain_model_news', 'n')
            ->leftJoin(
                'n',
                'sys_category_record_mm',
                'mm',
                $queryBuilder->expr()->and(
                    $queryBuilder->expr()->eq('mm.uid_foreign', $queryBuilder->quoteIdentifier('n.uid')),
                    $queryBuilder->expr()->eq('mm.tablenames', $queryBuilder->createNamedParameter('tx_news_domain_model_news')),
                    $queryBuilder->expr()->eq('mm.fieldname', $queryBuilder->createNamedParameter('categories'))
                )
            )
            ->leftJoin(
                'mm',
                'sys_category',
                'sc',
                $queryBuilder->expr()->and(
                    $queryBuilder->expr()->eq('sc.uid', $queryBuilder->quoteIdentifier('mm.uid_local')),
                    $queryBuilder->expr()->eq('sc.deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
                )
            )
            ->where(
                $queryBuilder->expr()->eq('n.deleted', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('n.hidden', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->groupBy('n.uid')
            ->orderBy('n.datetime', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

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
