<?php

declare(strict_types=1);

namespace Maidem\PdfExport\Controller;

use Maidem\PdfExport\Service\PdfDataService;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;
use Spatie\Browsershot\Browsershot;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\View\ViewFactoryData;
use TYPO3\CMS\Extbase\Mvc\Controller\ActionController;
use TYPO3\CMS\Fluid\View\FluidViewFactory;

/**
 * Controller to handle PDF generation requests.
 */
class PdfExportController extends ActionController implements LoggerAwareInterface
{
    use LoggerAwareTrait;

    public function __construct(
        private PdfDataService $pdfDataService,
        private FluidViewFactory $viewFactory
    ) {}

    /**
     * Entry point for the PDF generation.
     */
    public function generateAction(): ResponseInterface
    {
        $sectionsInput = $this->request->hasArgument('sections')
            ? $this->request->getArgument('sections')
            : ($this->request->getParsedBody()['sections'] ?? []);

        $site = $this->request->getAttribute('site');
        $rootPid = $site !== null ? $site->getRootPageId() : 0;

        // Build one block per cart entry, in the exact selection order.
        $blocks = [];
        foreach ($sectionsInput as $value) {
            if ($value === 'info') {
                $blocks[] = ['type' => 'info', 'data' => $this->pdfDataService->getAboutContent($rootPid)];
            } elseif ($value === 'contact') {
                $blocks[] = ['type' => 'contact', 'data' => $this->pdfDataService->getContactContent()];
            } elseif ($value === 'story') {
                $blocks[] = ['type' => 'story', 'data' => $this->pdfDataService->getStoryContent()];
            } elseif ($value === 'faq') {
                $blocks[] = ['type' => 'faq', 'data' => $this->pdfDataService->getFaqContent()];
            } elseif ($value === 'tech') {
                $blocks[] = ['type' => 'tech', 'data' => $this->pdfDataService->getTechContent()];
            } else {
                // News-based entries: project_/logbook_/news_ → single record block
                $uid = 0;
                $kind = '';
                if (str_starts_with($value, 'project_')) {
                    $uid = (int) substr($value, 8);
                    $kind = 'project';
                } elseif (str_starts_with($value, 'logbook_')) {
                    $uid = (int) substr($value, 8);
                    $kind = 'logbook';
                } elseif (str_starts_with($value, 'news_')) {
                    $uid = (int) substr($value, 5);
                    $kind = str_starts_with($this->pdfDataService->classifyNewsUid($uid), 'project_') ? 'project' : 'logbook';
                }
                if ($uid <= 0) {
                    continue;
                }
                if ($kind === 'project') {
                    $rows = $this->pdfDataService->getProjectsByUids([$uid]);
                    if (!empty($rows[0])) {
                        $blocks[] = ['type' => 'project', 'data' => $rows[0]];
                    }
                } else {
                    $rows = $this->pdfDataService->getLogbookByUids([$uid]);
                    if (!empty($rows[0])) {
                        $blocks[] = ['type' => 'logbook', 'data' => $rows[0]];
                    }
                }
            }
        }

        $viewData = new ViewFactoryData(
            templatePathAndFilename: GeneralUtility::getFileAbsFileName(
                'EXT:maidem_pdfexport/Resources/Private/Templates/PdfExport/Summary.html'
            ),
            request: $this->request
        );
        // Show a section heading only on the first block of each consecutive type run.
        $prevType = null;
        foreach ($blocks as $i => $block) {
            $blocks[$i]['showHeading'] = $block['type'] !== $prevType;
            $prevType = $block['type'];
        }

        $view = $this->viewFactory->create($viewData);
        $view->assign('blocks', $blocks);
        $html = $view->render();

        $chromePath = (string)(getenv('PDF_CHROMIUM_PATH') ?: '/usr/bin/chromium');
        $env = getenv('PDF_CHROMIUM_NO_SANDBOX');
        $noSandbox = $env === false || $env === ''
            ? true
            : filter_var($env, FILTER_VALIDATE_BOOLEAN);

        $browsershot = Browsershot::html($html)
            ->setChromePath($chromePath)
            ->showBackground()
            ->format('A4')
            ->windowSize(794, 1123);

        if ($noSandbox) {
            $browsershot->noSandbox();
        }

        try {
            $pdf = $browsershot->pdf();
        } catch (\Throwable $e) {
            // unsichtbar — der Frontend-Request bekam nur ein stummes 500-JSON.
            $this->logger?->error('PDF generation failed: ' . $e->getMessage(), ['exception' => $e]);

            return $this->responseFactory->createResponse(500)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->streamFactory->createStream(
                    json_encode(['error' => 'PDF generation failed. Please try again later.'], JSON_THROW_ON_ERROR)
                ));
        }

        return $this->responseFactory->createResponse()
            ->withHeader('Content-Type', 'application/pdf')
            ->withHeader('Content-Disposition', 'attachment; filename="Maik_Demuth_Portfolio_Export.pdf"')
            ->withBody($this->streamFactory->createStream($pdf));
    }
}
