# my_sitepackage

TYPO3-v14-Sitepackage für das Portfolio von Maik Demuth. Enthält alle Content Blocks, Seitenlayouts, Assets und sitepackage-eigene Frontend-Logik.

## Content Blocks

| Name | CType | Beschreibung |
| --- | --- | --- |
| `gripsraum/hero` | `gripsraum_hero` | Intro-Bereich mit zwei Textspalten |
| `gripsraum/banner` | `gripsraum_banner` | Vollbild-Banner mit Wordmark oder Kurzprofil + CTA-Buttons |
| `gripsraum/section-header` | `gripsraum_sectionheader` | Eigenständige Abschnittsüberschrift mit Subtext |
| `gripsraum/faq` | `gripsraum_faq` | Akkordeon-FAQ mit Kindtabelle |
| `gripsraum/skills` | `gripsraum_skills` | Tech-Stack-Übersicht mit Kategorien und Skills (verschachtelte Collections) |
| `gripsraum/projects` | `gripsraum_projects` | Projekt-/News-Liste inkl. optionaler Detailansicht |
| `gripsraum/contact-info` | `gripsraum_contactinfo` | Kontaktinformationen |
| `gripsraum/footer` | `gripsraum_footer` | Footer-Element |

Jeder Block liegt unter `ContentBlocks/ContentElements/<name>/` mit `config.yaml`, `templates/frontend.fluid.html`, `templates/backend-preview.fluid.html` und optionalen Assets in `assets/`.

Backend-Vorschauen verzichten bewusst auf feste Hex-Farben (Badges nutzen `color-mix(in srgb, currentColor …)`), damit sie in TYPO3s hellem und dunklem Backend-Theme gleichermaßen lesbar bleiben.

## Sprungmarken (`section_anchor`)

Mehrere Blöcke (banner, faq, hero, projects, skills, section-header) bieten das Feld **Anker-ID**, um Content-Elemente per Inhaltsverzeichnis oder Navigationslink direkt anspringbar zu machen.

## PDF-Warenkorb

Content-Elemente können im TYPO3-Backend über ein Toggle **„PDF-Export Button anzeigen"** einen Vormerken-Button im Frontend aktivieren. Unterstützte Blöcke: **hero**, **skills**, **contact-info**.

Die gesamte Logik läuft im Frontend ohne Server-State:

- `Resources/Private/JavaScript/PdfCart.js` — Warenkorb via `localStorage` (`maidem_pdf_cart`), Badge-Injektion in die Navigation, Toast-Feedback, Kachel-Synchronisation auf der PDF-Export-Seite
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
- Extension `maidem/pdf-export` für den PDF-Export-Seitentyp
