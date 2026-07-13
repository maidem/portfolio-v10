# maidem/pdf-export

TYPO3-Extension zur Erzeugung individueller PDF-Zusammenfassungen aus Website-Inhalten. Besucher wählen Abschnitte aus und erhalten ein druckfertiges PDF-Dokument.

## Überblick

Die Extension stellt einen konfigurierbaren PDF-Export bereit, der Inhalte aus verschiedenen Seitenbereichen zusammenführt:

Die Auswahl erfolgt über eine Kachel-Oberfläche im Frontend. Vorgemerkte Inhalte werden seitenübergreifend im localStorage gespeichert und beim Aufrufen der Export-Seite automatisch vorausgewählt.

## Voraussetzungen

- TYPO3 14+
- PHP 8.4+
- Chromium

## Installation

`composer install maidem/pdf-export`

## PDF-Warenkorb

Besucher können Inhalte seitenübergreifend vormerken, ganz ohne eigene Export-Seite:

- Content-Elemente bieten im Backend ein Toggle „PDF-Export Button anzeigen" (`data-pdf-section`); es gibt auch Gruppen-Buttons, die alle Items eines Bereichs auf einmal hinzufügen (`data-pdf-group`).
- Ein Klick im Frontend speichert `{ id, label }` im `localStorage` (Key `maidem_pdf_cart`).
- Ein schwebender Button unten rechts zeigt einen Badge-Zähler und öffnet bei Klick (bzw. kurz automatisch nach dem Hinzufügen) ein Panel mit allen vorgemerkten Einträgen.
- Im Panel lassen sich Einträge per Drag & Drop (Maus und Touch) neu sortieren und einzeln per **×** entfernen.
- **„PDF-Dossier herunterladen"** postet die gesammelten IDs in genau dieser Reihenfolge als `sections[]` an `?type=1711`, das PDF wird direkt heruntergeladen.
- Der Warenkorb ist über `localStorage` seitenübergreifend und synchronisiert sich per `storage`-Event live zwischen offenen Tabs.

## Technische Details

- **PageType 1711** — rendert ausschließlich den PDF-Inhalt ohne Seiten-Layout
- **PdfExportDataProcessor** — bereitet die Kachel-Auswahl im Frontend vor
- **PdfDataService** — liest Inhalte aus der Datenbank (QueryBuilder, parametrisiert): About, Kontakt, Story, FAQ, Skills sowie News-Datensätze (Projekte/Logbuch)
- **PdfExportController** — baut aus der Auswahl (`sections`-Parameter) die Blöcke, rendert sie per Fluid-Template und erzeugt das PDF via `spatie/browsershot` (Chromium) als Download

### Umgebungsvariablen

- `PDF_CHROMIUM_PATH` — Pfad zur Chromium-Binary (Default: `/usr/bin/chromium`)
- `PDF_CHROMIUM_NO_SANDBOX` — Chromium ohne Sandbox starten, z. B. in Docker-Containern (Default: aus)
