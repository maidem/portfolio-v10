<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\DataProcessing;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Frontend\ContentObject\ContentObjectRenderer;
use TYPO3\CMS\Frontend\ContentObject\DataProcessorInterface;

/**
 * Provides prevArticle / nextArticle variables for the news-article and project-article templates.
 *
 * Articles are sorted by project_date DESC (newest first), so:
 *   nextArticle = newer  (index − 1 in the sorted list)
 *   prevArticle = older  (index + 1 in the sorted list)
 *
 * Only articles from the same TYPO3 page (pid) are considered.
 *
 * TypoScript configuration:
 *   10 = Gripsraum\MySitepackage\DataProcessing\NewsArticleAdjacentProcessor
 *   10.ctype = gripsraum_projectarticle
 */
final class NewsArticleAdjacentProcessor implements DataProcessorInterface
{
    public function process(
        ContentObjectRenderer $cObj,
        array $contentObjectConfiguration,
        array $processorConfiguration,
        array $processedData,
    ): array {
        $currentUid = (int)($processedData['data']['uid'] ?? 0);
        $currentPid = (int)($processedData['data']['pid'] ?? 0);

        if ($currentUid === 0 || $currentPid === 0) {
            return $processedData;
        }

        $ctype = $processorConfiguration['ctype'] ?? 'gripsraum_newsarticle';

        $qb = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $articles = $qb
            ->select('uid', 'pid', 'header', 'gripsraum_newsarticle_project_date')
            ->from('tt_content')
            ->where(
                $qb->expr()->eq('CType', $qb->createNamedParameter($ctype)),
                $qb->expr()->eq('pid', $qb->createNamedParameter($currentPid, \Doctrine\DBAL\Types\Types::INTEGER)),
                $qb->expr()->eq('hidden', $qb->createNamedParameter(0, \Doctrine\DBAL\Types\Types::INTEGER)),
                $qb->expr()->eq('deleted', $qb->createNamedParameter(0, \Doctrine\DBAL\Types\Types::INTEGER)),
            )
            ->orderBy('gripsraum_newsarticle_project_date', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

        $currentIndex = null;
        foreach ($articles as $i => $article) {
            if ((int)$article['uid'] === $currentUid) {
                $currentIndex = $i;
                break;
            }
        }

        if ($currentIndex === null) {
            return $processedData;
        }

        // newer article (index before current in DESC-sorted list)
        $processedData['nextArticle'] = $currentIndex > 0
            ? $articles[$currentIndex - 1]
            : null;

        // older article (index after current in DESC-sorted list)
        $processedData['prevArticle'] = $currentIndex < (\count($articles) - 1)
            ? $articles[$currentIndex + 1]
            : null;

        return $processedData;
    }
}
