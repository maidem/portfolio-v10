# PDF-Export: Technische Erklärung

## Warum PHP und nicht JavaScript/Puppeteer?

TYPO3 ist ein PHP-Framework. Das bedeutet:

- Datenbankzugriffe, Authentifizierung und Content-Rendering laufen server-seitig in PHP
- Ein Node.js-Puppeteer-Service wäre eine separate Infrastrukturkomponente geworden (eigener Port, eigener Prozess) — unnötig komplex in einem PHP-Projekt
- Stattdessen wird Chromium direkt aus PHP via `spatie/browsershot` aufgerufen

---

## Technischer Ablauf

### 1. Auswahlformular (ContentBlock `gripsraum_pdfexport`)

Das Auswahlformular wird über die normale TYPO3/ContentBlocks-Pipeline gerendert:

```
tt_content.gripsraum_pdfexport
  └─ dataProcessing.10 = content-blocks          (stellt {data} für das Fluid-Template bereit)
  └─ dataProcessing.20 = PdfExportDataProcessor  (liefert {pdfProjects} und {pdfLogbook})
```

**Wichtig:** DataProcessor-Key `20`, nicht `10` — weil ContentBlocks seinen eigenen Processor bereits auf Key `10` registriert (`lib.contentBlock.dataProcessing.10 = content-blocks`). Key `10` würde den ContentBlocks-Processor stumm überschreiben, womit `{data}` im Template fehlen würde.

### 2. PdfExportDataProcessor (PHP)

`Classes/DataProcessing/PdfExportDataProcessor.php`

Fragt die Datenbank **ohne PID-Einschränkung** ab (damit alle Einträge systemweit erscheinen, unabhängig von der aktuellen Seite):

- `gripsraum_projects_project_items` → `{pdfProjects}`
- `tt_content` WHERE `CType='gripsraum_newsarticle'` → `{pdfLogbook}`

### 3. Template `frontend.fluid.html`

Rendert Checkboxen für jedes Projekt und jeden Logbuch-Eintrag. Die Checkbox-Werte folgen dem Schema `project_{uid}` bzw. `logbook_{uid}`.

### 4. PDF-Generierung (Extbase Controller)

Das Formular sendet an `?type=1711` (POST). Dieser PageType triggert den Extbase-Controller:

```
PdfExportController::generateAction()
  └─ Parst sections[] (z.B. ["project_3", "logbook_8"])
  └─ PdfDataService holt die gewählten Inhalte aus der DB
  └─ Rendert Summary.html (Fluid-Template, minimalistisches PDF-Layout)
  └─ Übergibt HTML an spatie/browsershot → Chromium
  └─ Chromium rendert HTML → PDF
  └─ Response: Content-Disposition: attachment → direkter Download
```

### 5. Chromium in DDEV/Docker

In der DDEV-Konfiguration ist Chromium als Extra-Package installiert:

```yaml
# .ddev/config.yaml
webimage_extra_packages:
  - chromium
```

Für Deployment auf VPS (Coolify):

```dockerfile
RUN apt-get update && apt-get install -y chromium
```

---

## Zusammenfassung

| Schicht          | Technologie            | Datei                                                |
| ---------------- | ---------------------- | ---------------------------------------------------- |
| Auswahlformular  | ContentBlocks + Fluid  | `templates/frontend.fluid.html`                      |
| Datenbeschaffung | PHP DataProcessor      | `Classes/DataProcessing/PdfExportDataProcessor.php`  |
| Daten für PDF    | PHP Service            | `Classes/Service/PdfDataService.php`                 |
| PDF-Generierung  | PHP Extbase + Chromium | `Classes/Controller/PdfExportController.php`         |
| PDF-Layout       | Fluid-Template         | `Resources/Private/Templates/PdfExport/Summary.html` |
