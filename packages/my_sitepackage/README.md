# my_sitepackage

TYPO3-v14-Sitepackage für das Portfolio von Maik Demuth. Enthält alle Content Blocks, Seitenlayouts, Assets und sitepackage-eigene Frontend-Logik.

## Content Blocks

| Name                     | CType                   | Beschreibung                                          |
| ------------------------ | ----------------------- | ----------------------------------------------------- |
| `gripsraum/hero`         | `gripsraum_hero`        | About-me-Sektion mit zwei Textspalten                 |
| `gripsraum/banner`       | `gripsraum_banner`      | Vollbild-Banner-Element                               |
| `gripsraum/faq`          | `gripsraum_faq`         | Akkordeon-FAQ mit Kindtabelle                         |
| `gripsraum/skills`       | `gripsraum_skills`      | Tech-Stack-Übersicht mit Kategorien                   |
| `gripsraum/projects`     | `gripsraum_projects`    | Projektliste (verweist auf news-article-Detailseiten) |
| `gripsraum/news-article` | `gripsraum_newsarticle` | Detailseite für Projekte und Logbuch-Einträge         |
| `gripsraum/news-list`    | `gripsraum_newslist`    | Listenansicht für Logbuch-Einträge                    |
| `gripsraum/page-header`  | `gripsraum_pageheader`  | Seitenüberschrift                                     |
| `gripsraum/footer`       | `gripsraum_footer`      | Footer-Element                                        |

Jeder Block liegt unter `ContentBlocks/ContentElements/<name>/` mit `config.yaml`, `templates/frontend.fluid.html` und optionalen Assets in `assets/`.

## PDF-Warenkorb

Content-Elemente können im TYPO3-Backend über ein Toggle **„PDF-Export Button anzeigen"** einen Vormerken-Button im Frontend aktivieren. Unterstützte Blöcke:

- **hero** → merkt Abschnitt `info` vor (About me)
- **news-article** → merkt `logbook_{uid}` vor (Projekte / Logbuch)

Die gesamte Logik läuft im Frontend ohne Server-State:

- `Resources/Private/JavaScript/PdfCart.js` — Warenkorb via `localStorage` (`gripsraum_pdf_cart`), Badge-Injektion in die Navigation, Toast-Feedback, Kachel-Synchronisation auf der PDF-Export-Seite
- `Resources/Private/Styles/PdfCart.scss` — Styles für den roten Bootstrap-Badge, den Add-Button und die Toast-Notification

## Assets & Build

Einstiegspunkt: `Resources/Private/JavaScript/Main.entry.js`

- Bootstrap (nur Modal), JetBrains Mono, `Main.entry.scss`
- `PdfCart.js` + `PdfCart.scss` (PDF-Warenkorb)
- Alle `frontend.{js,scss}` aus Content-Block-Asset-Ordnern werden automatisch per Vite-Glob geladen

```bash
npm run build   # Produktions-Build via Vite + vite-plugin-typo3
```

## Seitenlayouts

- `Resources/Private/PageView/Layouts/Default.html` — Haupt-Layout (Navigation, Mobile-Overlay, Footer)
- `Resources/Private/PageView/Pages/Default.html` / `News.html` — Seitenvorlagen

## Voraussetzungen

- TYPO3 14.1+, PHP 8.4+
- Extension `gripsraum/pdf-export` für den PDF-Export-Seitentyp
