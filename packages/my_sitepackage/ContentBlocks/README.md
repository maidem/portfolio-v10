# Content Blocks: News-System

Einfaches News-System bestehend aus zwei Content Blocks für TYPO3 v14 mit der Extension `friendsoftypo3/content-blocks`.

---

## Übersicht

| Content Block    | CType                   | Zweck                                                                            |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------- |
| **news-article** | `gripsraum_newsarticle` | Einzelner News-Artikel (wird auf einer Unterseite angelegt)                      |
| **news-list**    | `gripsraum_newslist`    | Listenansicht, die News-Artikel aus einem Ordner sammelt und als Cards darstellt |

### Zusammenspiel

```
Startseite (pid=1)
└── [news-list]  ← sammelt Artikel und zeigt Teaser-Cards
     │
     └── liest aus ↓

Artikel-Ordner (pid=2, doktype=254, backend_layout_next_level=pagets__news)
├── Artikel-Seite A (backend_layout=pagets__news)
│   └── [news-article]  ← Volltext mit Headline, Datum, Bild, Text
├── Artikel-Seite B
│   └── [news-article]
└── ...
```

Die **news-list** holt per `database-query` DataProcessor alle `tt_content`-Datensätze vom Typ `gripsraum_newsarticle` aus dem konfigurierten Storage-Ordner und rendert sie als Card-Grid. Der „Weiterlesen"-Link führt zur jeweiligen Artikel-Seite.

---

## news-article

### Felder (`config.yaml`)

| Feld           | Typ                       | DB-Spalte                            | Beschreibung               |
| -------------- | ------------------------- | ------------------------------------ | -------------------------- |
| `header`       | Text (existierend)        | `header`                             | Überschrift des Artikels   |
| `project_date` | DateTime                  | `gripsraum_newsarticle_project_date` | Veröffentlichungsdatum     |
| `teaser_image` | File (max. 1, nur Bilder) | `gripsraum_newsarticle_teaser_image` | Vorschaubild für die Liste |
| `teaser_text`  | Textarea                  | `gripsraum_newsarticle_teaser_text`  | Kurzfassung für die Liste  |
| `bodytext`     | RichText (existierend)    | `bodytext`                           | Haupttext des Artikels     |

### Dateistruktur

```
ContentBlocks/ContentElements/news-article/
├── config.yaml                      # Feld-Definitionen
├── assets/                          # (leer – kein eigenes Icon)
└── templates/
    └── frontend.fluid.html          # Frontend-Template (Detail-Ansicht)
```

### Template-Variablen (frontend.fluid.html)

Das Template erhält automatisch `{data}` als `ContentBlockData`-Objekt:

- `{data.header}` – Überschrift
- `{data.gripsraum_newsarticle_project_date}` – `DateTimeImmutable`-Objekt (mit `f:format.date` formatieren)
- `{data.bodytext}` – RichText-HTML (mit `f:format.html` rendern)

> **Wichtig:** `f:format.date` muss im Attribut-Syntax verwendet werden:
>
> ```html
> <f:format.date
>     format="d.m.Y"
>     date="{data.gripsraum_newsarticle_project_date}"
> />
> ```
>
> Die Child-Node-Syntax (`<f:format.date>{data.…}</f:format.date>`) crasht mit `DateTimeImmutable`-Objekten.

---

## news-list

### Felder (`config.yaml`)

| Feld             | Typ                  | DB-Spalte                           | Beschreibung                           |
| ---------------- | -------------------- | ----------------------------------- | -------------------------------------- |
| `header`         | Text (existierend)   | `header`                            | Überschrift der Liste                  |
| `storage_folder` | Relation → `pages`   | `gripsraum_newslist_storage_folder` | Ordner, aus dem Artikel geladen werden |
| `max_items`      | Number (default: 10) | `gripsraum_newslist_max_items`      | Max. Anzahl angezeigter Artikel        |

### Dateistruktur

```
ContentBlocks/ContentElements/news-list/
├── config.yaml                      # Feld-Definitionen
├── assets/
│   └── icon.svg                     # Backend-Icon (Grid-Symbol)
└── templates/
    └── frontend.fluid.html          # Frontend-Template (Card-Grid)
```

### DataProcessing (TypoScript)

Die news-list benötigt **zusätzliches TypoScript**, das nicht im Content Block selbst liegt, sondern im SitePackage:

**`Configuration/Sets/SitePackage/TypoScript/content-blocks.typoscript`**

```typoscript
tt_content.gripsraum_newslist {
    dataProcessing {
        10 = database-query
        10 {
            table = tt_content
            where = CType='gripsraum_newsarticle' AND hidden=0 AND deleted=0
            pidInList.field = gripsraum_newslist_storage_folder
            pidInList.ifEmpty.data = page:uid
            recursive = 2
            orderBy = gripsraum_newsarticle_project_date DESC
            max.field = gripsraum_newslist_max_items
            as = news

            dataProcessing {
                10 = record-transformation
                20 = files
                20 {
                    references.fieldName = gripsraum_newsarticle_teaser_image
                    as = images
                }
            }
        }
    }
}
```

**Erklärung:**

- `database-query` holt alle `gripsraum_newsarticle`-Datensätze aus dem Storage-Ordner
- `record-transformation` wandelt die DB-Zeilen in Record-Objekte um (z.B. DateTime-Felder → `DateTimeImmutable`)
- `files` löst die File-Referenzen (`sys_file_reference`) des Teaser-Bilds auf → verfügbar als `{item.images}`

> **Wichtig:** Das Bild-Feld (`teaser_image`) speichert in der DB nur einen Integer (Anzahl Referenzen). Ohne den `files`-DataProcessor kann `f:for` nicht darüber iterieren und wirft eine Exception.

### Template-Variablen (frontend.fluid.html)

- `{data}` – Das news-list Content-Element selbst
- `{news}` – Array der geladenen news-article Records (durch DataProcessing bereitgestellt)

Pro `{item}` in `{news}`:

- `{item.data.header}` – Artikelüberschrift
- `{item.data.gripsraum_newsarticle_project_date}` – Datum (`DateTimeImmutable`)
- `{item.data.gripsraum_newsarticle_teaser_text}` – Teaser-Text
- `{item.data.pid}` – Seiten-ID (für den Link)
- `{item.data.uid}` – Content-Element-ID (für Anker `#c{uid}`)
- `{item.images}` – Array von `FileReference`-Objekten (durch `files` DataProcessor)

---

## Weitere Konfiguration außerhalb der Content Blocks

### Backend Layout (`news.tsconfig`)

Definiert ein eigenes Backend Layout für Artikel-Seiten, das nur `gripsraum_newsarticle` als Inhaltselement zulässt:

```
PageTsConfig/BackendLayouts/news.tsconfig
```

- `colPos = 0`, `identifier = main`
- `allowed = gripsraum_newsarticle` – schränkt die erlaubten CTypes ein

### Page Template (`News.html`)

Eigenes Page-Template für das News-Backend-Layout:

```
Resources/Private/PageView/Pages/News.html
```

Identisch zum `Default.html` – nutzt das Default-Layout und rendert den `main`-Bereich.

### TSconfig-Bedingungen (`page.tsconfig`)

```typoscript
# Automatisches Setzen des Backend Layouts für neue Unterseiten
[traverse(page, 'backend_layout_next_level') == 'pagets__news']
    TCAdefaults.pages.backend_layout = pagets__news
[global]

# Nur news-article als CType zulassen
[page["backend_layout"] == 'pagets__news']
    TCEFORM.tt_content.CType.keepItems = gripsraum_newsarticle
[global]
```

Zusätzlich werden irrelevante Backend-Felder für `gripsraum_newsarticle` ausgeblendet (Sprache, Zugriff, Erscheinungsbild, Kategorien).

---

## Wiederverwendung in anderen Projekten

### Schritt-für-Schritt

1. **Content-Block-Verzeichnisse kopieren:**

    ```
    ContentBlocks/ContentElements/news-article/  → ins neue Sitepackage
    ContentBlocks/ContentElements/news-list/     → ins neue Sitepackage
    ```

2. **Vendor-Prefix anpassen** (falls nötig):
   In beiden `config.yaml` den `name` ändern, z.B.:

    ```yaml
    # Vorher
    name: gripsraum/news-article

    # Nachher (Beispiel)
    name: meinefirma/news-article
    ```

    > **Achtung:** Der Vendor-Prefix bestimmt die DB-Spaltennamen! Bei Änderung müssen **alle** Referenzen auf die langen Feldnamen angepasst werden:
    >
    > - `gripsraum_newsarticle_*` → `meinefirma_newsarticle_*` (TypoScript, Fluid-Templates, TSconfig)

3. **TypoScript für DataProcessing übernehmen:**
   Die Datei `TypoScript/content-blocks.typoscript` ins neue Sitepackage kopieren. Bei geändertem Vendor-Prefix die Feldnamen anpassen:
    - `tt_content.gripsraum_newslist` → `tt_content.meinefirma_newslist`
    - `CType='gripsraum_newsarticle'` → `CType='meinefirma_newsarticle'`
    - `gripsraum_newslist_storage_folder` → `meinefirma_newslist_storage_folder`
    - `gripsraum_newslist_max_items` → `meinefirma_newslist_max_items`
    - `gripsraum_newsarticle_project_date` → `meinefirma_newsarticle_project_date`
    - `gripsraum_newsarticle_teaser_image` → `meinefirma_newsarticle_teaser_image`

4. **Backend Layout anlegen:**
   `PageTsConfig/BackendLayouts/news.tsconfig` übernehmen. Bei geändertem Vendor-Prefix:
    - `allowed = gripsraum_newsarticle` → `allowed = meinefirma_newsarticle`

5. **Page Template erstellen:**
   `Resources/Private/PageView/Pages/News.html` anlegen (oder den Namen des Backend Layouts anpassen).

6. **TSconfig-Bedingungen übernehmen:**
   Aus `page.tsconfig` die Blöcke für `pagets__news` und die TCEFORM-Ausblendungen kopieren. Bei geändertem Vendor-Prefix:
    - `TCEFORM.tt_content.CType.keepItems = gripsraum_newsarticle` anpassen
    - Alle `.types { gripsraum_newsarticle.disabled = 1 }` anpassen

7. **Extension-Abhängigkeit prüfen:**
   `composer.json` bzw. `ext_emconf.php` muss `friendsoftypo3/content-blocks` als Abhängigkeit haben.

8. **Seitenstruktur im Backend anlegen:**
    - Artikel-Ordner erstellen (Typ: Ordner / `doktype=254`)
    - Am Ordner `Backend Layout (Unterseiten)` = „News Artikel" setzen
    - Neue Seiten unter dem Ordner anlegen → bekommen automatisch das News-Layout
    - In jeder Artikelseite ein `news-article`-Element anlegen
    - Auf der Startseite (oder beliebiger Seite) ein `news-list`-Element anlegen und den Storage-Ordner auswählen

### Checkliste

- [ ] `ContentBlocks/ContentElements/news-article/` kopiert
- [ ] `ContentBlocks/ContentElements/news-list/` kopiert
- [ ] `config.yaml` Vendor-Prefix geprüft/angepasst
- [ ] `TypoScript/content-blocks.typoscript` übernommen und Feldnamen angepasst
- [ ] `PageTsConfig/BackendLayouts/news.tsconfig` übernommen
- [ ] `PageView/Pages/News.html` angelegt
- [ ] `page.tsconfig` Bedingungen übernommen
- [ ] `friendsoftypo3/content-blocks` als Abhängigkeit vorhanden
- [ ] Seitenstruktur im Backend aufgebaut (Ordner + Layout-Zuweisung)
