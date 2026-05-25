<?php

declare(strict_types=1);

namespace Gripsraum\PdfExport\Controller;

use Gripsraum\PdfExport\Service\PdfDataService;
use Psr\Http\Message\ResponseInterface;
use Spatie\Browsershot\Browsershot;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\View\ViewFactoryData;
use TYPO3\CMS\Extbase\Mvc\Controller\ActionController;
use TYPO3\CMS\Fluid\View\FluidViewFactory;

/**
 * Controller to handle PDF generation requests.
 */
class PdfExportController extends ActionController
{
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

        $projectUids = [];
        $logbookUids = [];
        foreach ($sectionsInput as $value) {
            if (str_starts_with($value, 'project_')) {
                $projectUids[] = (int) substr($value, 8);
            } elseif (str_starts_with($value, 'logbook_')) {
                $logbookUids[] = (int) substr($value, 8);
            }
        }

        $activeSections = [
            'info'     => in_array('info', $sectionsInput),
            'faq'      => in_array('faq', $sectionsInput),
            'tech'     => in_array('tech', $sectionsInput),
            'projects' => !empty($projectUids),
            'logbook'  => !empty($logbookUids),
        ];

        $site = $this->request->getAttribute('site');
        $rootPid = $site !== null ? $site->getRootPageId() : 0;

        $data = [
            'about'     => $activeSections['info']     ? $this->pdfDataService->getAboutContent($rootPid)             : '',
            'faq'       => $activeSections['faq']      ? $this->pdfDataService->getFaqContent()                 : [],
            'tech'      => $activeSections['tech']     ? $this->pdfDataService->getTechContent()                : [],
            'workflows' => $activeSections['tech']     ? $this->pdfDataService->getWorkflowsContent()           : [],
            'projects'  => $activeSections['projects'] ? $this->pdfDataService->getProjectsByUids($projectUids) : [],
            'logbook'   => $activeSections['logbook']  ? $this->pdfDataService->getLogbookByUids($logbookUids)  : [],
        ];

        $viewData = new ViewFactoryData(
            templatePathAndFilename: GeneralUtility::getFileAbsFileName(
                'EXT:gripsraum_pdfexport/Resources/Private/Templates/PdfExport/Summary.html'
            ),
            request: $this->request
        );
        $view = $this->viewFactory->create($viewData);
        $view->assign('sections', $activeSections);
        $view->assign('data', $data);
        $html = $view->render();

        $chromePath = (string)(getenv('PDF_CHROMIUM_PATH') ?: '/usr/bin/chromium');
        $noSandbox = filter_var(getenv('PDF_CHROMIUM_NO_SANDBOX') ?: false, FILTER_VALIDATE_BOOLEAN);

        $browsershot = Browsershot::html($html)
            ->setChromePath($chromePath)
            ->showBackground()
            ->format('A4');

        if ($noSandbox) {
            $browsershot->noSandbox();
        }

        try {
            $pdf = $browsershot->pdf();
        } catch (\Throwable $e) {
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
