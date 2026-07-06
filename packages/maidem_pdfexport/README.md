# gripsraum/pdf-export

TYPO3-Extension zur Erzeugung individueller PDF-Zusammenfassungen aus Website-Inhalten. Besucher wählen Abschnitte aus und erhalten ein druckfertiges PDF-Dokument.

## Überblick

Die Extension stellt einen konfigurierbaren PDF-Export bereit, der Inhalte aus verschiedenen Seitenbereichen zusammenführt:

Die Auswahl erfolgt über eine Kachel-Oberfläche im Frontend. Vorgemerkte Inhalte werden seitenübergreifend im `localStorage` gespeichert und beim Aufrufen der Export-Seite automatisch vorausgewählt.

## Voraussetzungen

- TYPO3 14+
- PHP 8.4+
- Chromium

## Installation

`composer install gripsraum/pdf-export`

## PDF-Warenkorb

Besucher können Inhalte bereits auf anderen Seiten vormerken:

- Content-Elemente bieten im Backend ein Toggle **„PDF-Export Button anzeigen"**.
- Ein Klick im Frontend speichert die Abschnitts-ID im `localStorage`.
- Ein Badge-Zähler im Navigationslink zeigt die Anzahl vorgemerkter Einträge.
- Auf der Export-Seite sind vorgemerkte Kacheln automatisch ausgewählt; Änderungen synchronisieren sich zurück.

## Technische Details

- **PageType 1711** — rendert ausschließlich den PDF-Inhalt ohne Seiten-Layout
- **PdfExportDataProcessor** — bereitet die Kachel-Auswahl im Frontend vor
- **PdfDataService** — liest Inhalte aus der Datenbank (QueryBuilder, parametrisiert)
- **PdfExportController** — erzeugt das PDF via `spatie/browsershot` und gibt es als Download zurück
