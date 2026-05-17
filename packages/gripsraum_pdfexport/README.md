# gripsraum/pdf-export

TYPO3-v14-Extension, die eine individuelle PDF-Zusammenfassung des Portfolio-Inhalts über headless Chromium (`spatie/browsershot`) erzeugt.

## So funktioniert es

1. Ein Frontend-Content-Element (`gripsraum_pdfexport` CType) zeigt ein Checkbox-Formular — Besucher wählen, welche Abschnitte enthalten sein sollen.
2. Beim Absenden wird das Formular an dieselbe Seite mit `&type=1711` gepostet.
3. Der PageType `1711` startet `PdfExportController::generateAction()` via Extbase.
4. `PdfDataService` liest die benötigten ContentBlock-Tabellen direkt aus der Datenbank.
5. Ein Fluid-Template (`Summary.html`) rendert die Daten als eigenständiges HTML-Dokument.
6. Browsershot übergibt das HTML an `/usr/bin/chromium` (headless) und liefert einen binären PDF-Stream zurück.

## Vorauswahl (PDF-Warenkorb)

Besucher können Inhalte bereits auf anderen Seiten vormerken, bevor sie das PDF-Export-Formular aufrufen:

- Einzelne Content-Elemente (`hero`, `news-article`) bieten im Backend ein Toggle **„PDF-Export Button anzeigen"** — bei Aktivierung erscheint ein Button im Frontend.
- Ein Klick speichert die Abschnitts-ID im `localStorage` (Schlüssel `gripsraum_pdf_cart`).
- Ein roter Badge-Zähler neben dem **Pdf-Export**-Navigationslink zeigt seitenübergreifend die Anzahl vorgemerkter Einträge.
- Auf der PDF-Export-Seite sind vorgemerkte Kacheln automatisch vorausgewählt; Änderungen dort synchronisieren sich zurück in den Warenkorb.
- Implementiert in `my_sitepackage`: `Resources/Private/JavaScript/PdfCart.js` + `Resources/Private/Styles/PdfCart.scss`.

## Wählbare Abschnitte

| Checkbox-Wert   | Datenquelle                                             |
| --------------- | ------------------------------------------------------- |
| `info`          | `gripsraum_hero` bodytext                               |
| `faq`           | `gripsraum_faq` + Kindtabelle `gripsraum_faq_faq_items` |
| `tech`          | `gripsraum_skills` + Kindeinträge                       |
| `project_<uid>` | `gripsraum_projects`-Eintrag per UID                    |
| `logbook_<uid>` | `gripsraum_newsarticle`-Eintrag per UID                 |

## Voraussetzungen

- TYPO3 14.1+, PHP 8.4+
- `spatie/browsershot` ^5.2
- Chromium unter `/usr/bin/chromium` (im DDEV-Webcontainer via `webimage_extra_packages: ["chromium"]` und im produktiven Docker-Image installiert)

## Site Set

Set in der Site-Konfiguration eintragen:

```yaml
dependencies:
  - gripsraum/pdf-export
```

Dadurch wird `setup.typoscript` eingebunden, das den `gripsraum_pdfexport`-FLUIDTEMPLATE-Renderer und den `pdf_export`-PageType (`typeNum = 1711`) registriert.

## Extension-Struktur

```
Classes/
  Controller/PdfExportController.php         # Extbase-Controller, Einstiegspunkt für type=1711
  DataProcessing/PdfExportDataProcessor.php  # Stellt Daten für das Frontend-CE-Template bereit
  Service/PdfDataService.php                 # DB-Abfragen für alle wählbaren Abschnitte
Configuration/
  Sets/PdfExport/
    config.yaml                              # Site-Set-Definition
    setup.typoscript                         # FLUIDTEMPLATE + PageType 1711
  Services.yaml                              # Dependency Injection
  TCA/Overrides/tt_content.php               # Registriert den gripsraum_pdfexport-CType
Resources/
  Private/Templates/
    ContentElements/PdfExport.html           # Frontend-Checkbox-Formular
    PdfExport/Summary.html                   # PDF-Fluid-Template (A4-Layout)
  Private/Scss/PdfExport.scss                # Druckstile, inline in Summary.html
  Public/Icons/pdfexport.svg                 # Backend-CType-Icon
```
