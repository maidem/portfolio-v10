<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\EventListener;

use TYPO3\CMS\Backend\LoginProvider\Event\ModifyPageLayoutOnLoginProviderSelectionEvent;
use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Core\Page\PageRenderer;

#[AsEventListener]
final readonly class BackendLoginStyleEventListener
{
    public function __construct(private PageRenderer $pageRenderer) {}

    public function __invoke(ModifyPageLayoutOnLoginProviderSelectionEvent $event): void
    {
        $this->pageRenderer->addCssFile('EXT:my_sitepackage/Resources/Public/Css/backend-login.css');
        $this->pageRenderer->addJsFooterFile('EXT:my_sitepackage/Resources/Public/JavaScript/backend-login-dim.js');
    }
}
