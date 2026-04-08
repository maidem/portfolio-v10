# PDF-Export Logik: Dokumentation & Umsetzung

Dieses Element ermöglicht es Arbeitgebern, eine individuell zusammengestellte Übersicht meines Portfolios als minimalistisches PDF zu exportieren. Hier ist dokumentiert, wie ich das System technisch aufgebaut habe.

## 1. Infrastruktur & Voraussetzungen
Für eine perfekte Rendering-Qualität nutze ich **Headless Chrome**.

- **DDEV/Docker:** In der `.ddev/config.yaml` habe ich `chromium` als Extra-Paket hinzugefügt, damit der Server eine Rendering-Engine besitzt.
- **PHP-Engine:** Ich nutze `spatie/browsershot`. Das Tool startet im Hintergrund Chromium, rendert das HTML meiner Seite und speichert es als PDF.
- **Node.js:** Puppeteer (der Treiber für Chrome) wurde via NPM im Container installiert.

## 2. Die Daten-Engine (`PdfDataService.php`)
Damit die PDF immer die aktuellsten Inhalte enthält, habe ich einen Service geschrieben, der die Daten direkt aus der TYPO3-Datenbank zieht.

- **About/Info:** Liest das Feld `bodytext` aus meinem `gripsraum_about` Content-Block.
- **Collections:** Da meine Technologien, FAQ und Projekte in TYPO3-Collections gespeichert sind, greift der Service direkt auf die dafür generierten Tabellen (z.B. `gripsraum_faq_faq_items`) zu.
- **Abfrage:** Es wird immer der jeweils aktuellste Eintrag (neueste UID) für jede Kategorie auf der Seite genommen.

## 3. Das PDF-Template (`Summary.html`)
Das Design des PDFs soll sich bewusst vom Web-Design abheben: Minimalistisch, professionell und druckfreundlich.

- **Typografie:** Nutzung von `Inter` für eine moderne, sachliche Ausstrahlung.
- **Layout:** Strukturierung in klare Sektionen mit Trennlinien. 
- **Header:** Fixierter Bereich oben links mit dem Branding "PORTFOLIO" und meinem Namen.
- **Seitenformate:** Definiert auf DIN-A4 mit 2cm Seitenrand via CSS `@page`.

## 4. Routing & Controller (`PdfExportController.php`)
Die PDF-Erstellung wird über einen eigenen **PageType (1711)** gesteuert.

- Warum ein PageType? So kann das PDF generiert werden, ohne dass eine normale TYPO3-Seite mit Header/Footer drumherum gerendert wird.
- Der Controller nimmt die Checkbox-Werte entgegen, entscheidet, welche Daten geladen werden, rendert das HTML-Template und übergibt es an Browsershot.
- Der Browser-Response wird so gesetzt, dass das PDF sofort als Download (`attachment`) im Browser des Nutzers erscheint.

## 5. Deployment auf VPS (Coolify)
Da die App in einem Docker-Container läuft, muss auf dem Live-Server sichergestellt sein, dass Chromium vorhanden ist.
In dem `Dockerfile` für Coolify müssen folgende Befehle enthalten sein:
```dockerfile
RUN apt-get update && apt-get install -y chromium
```

## 6. Formular-Technik
Da Content-Blocks nicht im Extbase-Kontext gerendert werden, nutzen wir ein klassisches HTML-Formular. Der Controller wurde so programmiert, dass er sowohl Extbase-Argumente als auch direkte POST-Daten verarbeiten kann.

## 7. UI & Layout
Das Element nutzt das Standard-Card-System des Sitepackages (`.cb-card`). Durch die Aufteilung in `cb-card__left` (Überschrift) und `cb-card__right` (Inhalt) wird im Frontend automatisch das 2-Spalten-Grid aktiviert, sobald der Viewport groß genug ist.

## 8. Datenbank-Kompatibilität (TYPO3 v14)
In TYPO3 v14 (Doctrine DBAL 3+) müssen bei Abfragen die modernen Parameter-Typen verwendet werden. Statt `\PDO::PARAM_INT` wird `\Doctrine\DBAL\ParameterType::INTEGER` genutzt, um 503-Fehler zu vermeiden.
Zudem verwenden Content Blocks Collections (FAQ, Skills, Projects) das Feld `foreign_table_parent_uid` statt `parent_id` für die Verknüpfung zum Haupt-Element.

## 9. Fluid View API (TYPO3 v14)
Da `StandaloneView` in TYPO3 v14 entfernt wurde, nutzt der Controller die neue `FluidViewFactory` und `ViewFactoryData`. Dies ist der moderne Weg, um Fluid-Templates außerhalb des Standard-Rendering-Flows zu verarbeiten.

## 10. Lokales Testen
In DDEV kann die Funktion ab sofort getestet werden. Da ich den Cache geflasht und TypoScript eingebunden habe, reagiert der Button im gelben PDF-Block sofort und stößt den Download-Prozess an.

## 11. Browsershot & Sandbox (Docker/DDEV)
In Docker-Umgebungen (wie DDEV oder Coolify) muss Browsershot mit dem Flag `noSandbox()` aufgerufen werden, da Chromium innerhalb des Containers keine Berechtigung für das Standard-Sandboxing hat. Dies ist im Controller bereits implementiert.

## 12. Service-Registrierung (`Services.yaml`)
Damit der `PdfExportController` von TYPO3 gefunden wird, ist er in `Configuration/Services.yaml` als öffentlicher Service registriert.
