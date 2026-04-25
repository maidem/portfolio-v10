<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\Controller;

use Gripsraum\MySitepackage\Service\PdfDataService;
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
        // Get selected sections from request (check both Extbase argument and raw POST body)
        $sectionsInput = $this->request->hasArgument('sections') 
            ? $this->request->getArgument('sections') 
            : ($this->request->getParsedBody()['sections'] ?? []);
        
        $activeSections = [
            'info' => in_array('info', $sectionsInput),
            'faq' => in_array('faq', $sectionsInput),
            'tech' => in_array('tech', $sectionsInput),
            'projects' => in_array('projects', $sectionsInput),
            'logbook' => in_array('logbook', $sectionsInput),
        ];

        // Fetch data
        $data = [
            'about' => $activeSections['info'] ? $this->pdfDataService->getAboutContent() : '',
            'faq' => $activeSections['faq'] ? $this->pdfDataService->getFaqContent() : [],
            'tech' => $activeSections['tech'] ? $this->pdfDataService->getTechContent() : [],
            'projects' => $activeSections['projects'] ? $this->pdfDataService->getProjectsContent() : [],
            'logbook' => $activeSections['logbook'] ? $this->pdfDataService->getLogbookContent() : [],
        ];

        // Render HTML using FluidViewFactory (TYPO3 v14 style)
        $viewData = new ViewFactoryData(
            templatePathAndFilename: GeneralUtility::getFileAbsFileName('EXT:my_sitepackage/Resources/Private/Templates/Pdf/Summary.html'),
            request: $this->request
        );
        $view = $this->viewFactory->create($viewData);
        $view->assign('sections', $activeSections);
        $view->assign('data', $data);
        $html = $view->render();

        // Generate PDF via Browsershot using the local Chromium binary installed
        // in the app container (see Dockerfile).
        $pdf = Browsershot::html($html)
            ->setChromePath('/usr/bin/chromium')
            ->noSandbox()
            ->showBackground()
            ->format('A4')
            ->pdf();

        return $this->responseFactory->createResponse()
            ->withHeader('Content-Type', 'application/pdf')
            ->withHeader('Content-Disposition', 'attachment; filename="Maik_Demuth_Portfolio_Export.pdf"')
            ->withBody($this->streamFactory->createStream($pdf));
    }
}
