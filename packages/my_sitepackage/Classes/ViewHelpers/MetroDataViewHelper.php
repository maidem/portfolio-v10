<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\ViewHelpers;

use Doctrine\DBAL\ParameterType;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Reads the raw tx_mysitepackage_metro JSON string for a news record.
 *
 * The field is a plain TCA column, not mapped onto the EXT:news domain model,
 * so Fluid can't reach it via {newsItem.*}. One tiny query is cheaper than a
 * model subclass + Extbase persistence mapping.
 *
 * Usage: <my:metroData uid="{newsItem.uid}" /> — returns "" when empty/invalid.
 */
final class MetroDataViewHelper extends AbstractViewHelper
{
    public function initializeArguments(): void
    {
        $this->registerArgument('uid', 'int', 'News record uid', true);
    }

    public function render(): string
    {
        $uid = (int)$this->arguments['uid'];
        if ($uid <= 0) {
            return '';
        }

        $qb = GeneralUtility::makeInstance(ConnectionPool::class)
            ->getQueryBuilderForTable('tx_news_domain_model_news');
        $qb->getRestrictions()->removeAll();

        $json = $qb
            ->select('tx_mysitepackage_metro')
            ->from('tx_news_domain_model_news')
            ->where($qb->expr()->eq('uid', $qb->createNamedParameter($uid, ParameterType::INTEGER)))
            ->executeQuery()
            ->fetchOne();

        if (!is_string($json) || trim($json) === '') {
            return '';
        }

        // nur validieren, nicht umbauen – das JS parst denselben String
        return json_decode($json) === null ? '' : $json;
    }
}
