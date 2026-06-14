# gripsraum/pdf-export

TYPO3-v14-Extension, die eine individuelle PDF-Zusammenfassung des Portfolio-Inhalts erzeugt.

## Vorauswahl PDF-Warenkorb

Besucher können Inhalte bereits auf anderen Seiten vormerken, bevor sie das PDF-Export-Formular aufrufen:

- Einzelne Content-Elemente (`hero`, `news-article`) bieten im Backend ein Toggle **„PDF-Export Button anzeigen"** — bei Aktivierung erscheint ein Button im Frontend.
- Ein Klick speichert die Abschnitts-ID im `localStorage`.
- Ein Badge-Zähler neben dem **Pdf-Export**-Navigationslink zeigt seitenübergreifend die Anzahl vorgemerkter Einträge.
- Auf der PDF-Export-Seite sind vorgemerkte Kacheln automatisch vorausgewählt; Änderungen dort synchronisieren sich zurück in den Warenkorb.

## Voraussetzungen

- TYPO3 14.1+, PHP 8.4+
- Chromium
