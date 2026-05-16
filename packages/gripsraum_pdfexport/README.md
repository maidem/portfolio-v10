# gripsraum/pdf-export

TYPO3 v14 extension that generates a custom PDF summary of portfolio content via headless Chromium (`spatie/browsershot`).

## How it works

1. A frontend content element (`gripsraum_pdfexport` CType) renders a checkbox form — visitors select which sections to include.
2. On submit the form posts to the same page with `&type=1711`.
3. The PageType `1711` bootstraps `PdfExportController::generateAction()` via Extbase.
4. `PdfDataService` queries the relevant ContentBlock tables directly and returns structured data.
5. A Fluid template (`Summary.html`) renders the data as a self-contained HTML document.
6. Browsershot pipes the HTML through `/usr/bin/chromium` (headless) and returns a binary PDF stream.

## Selectable sections

| Checkbox value | Data source |
|---|---|
| `info` | `gripsraum_hero` bodytext |
| `faq` | `gripsraum_faq` + child table `gripsraum_faq_faq_items` |
| `tech` | `gripsraum_skills` + child items |
| `project_<uid>` | `gripsraum_projects` row by UID |
| `logbook_<uid>` | `gripsraum_news_article` row by UID |

## Requirements

- TYPO3 14.1+, PHP 8.4+
- `spatie/browsershot` ^5.2
- Chromium at `/usr/bin/chromium` (installed in the DDEV web container via `webimage_extra_packages: ["chromium"]` and in the production Docker image)

## Site Set

Register the set in your site configuration:

```yaml
dependencies:
  - gripsraum/pdf-export
```

This includes `setup.typoscript` which registers the `gripsraum_pdfexport` FLUIDTEMPLATE renderer and the `pdf_export` PageType (`typeNum = 1711`).

## Extension structure

```
Classes/
  Controller/PdfExportController.php     # Extbase action controller, entry point for type=1711
  DataProcessing/PdfExportDataProcessor.php  # Passes page data to the frontend CE template
  Service/PdfDataService.php             # DB queries for all selectable sections
Configuration/
  Sets/PdfExport/
    config.yaml                          # Site Set definition
    setup.typoscript                     # FLUIDTEMPLATE + PageType 1711
  Services.yaml                          # Dependency injection
  TCA/Overrides/tt_content.php           # Registers gripsraum_pdfexport CType
Resources/
  Private/Templates/
    ContentElements/PdfExport.html       # Frontend checkbox form
    PdfExport/Summary.html               # PDF Fluid template (A4 layout)
  Private/Scss/PdfExport.scss            # Print styles inlined into Summary.html
  Public/Icons/pdfexport.svg             # Backend CType icon
```
