# maik-demuth.de — Portfolio (TYPO3 v14)

Persönliche Portfolio-Website von Maik Demuth, gebaut mit **TYPO3 v14**, **PHP 8.4**, **Vite** und **Bootstrap 5**, deployed via **Coolify** auf einem Tailscale-gesicherten Server.

> Dieses Repository diente ursprünglich als TYPO3-v14/Coolify-Deployment-Blueprint und wurde inzwischen zur produktiven Portfolio-Site weiterentwickelt.

---

## ✨ Features

- **TYPO3 v14.3** mit modernen [Site Sets](https://docs.typo3.org/permalink/t3coreapi:site-sets) und [Content Blocks](https://docs.typo3.org/permalink/t3contentblocks:start) statt klassischem TypoScript-Templating
- **Vite 7** mit `vite-plugin-typo3` und [praetorius/vite-asset-collector](https://packagist.org/packages/praetorius/vite-asset-collector)
  - Dynamic Glob-Import lädt automatisch alle ContentBlock-Assets
  - Bootstrap 5.3 + `@fontsource/inter` als Web-Font
- **PDF-Export** der Portfolio-Inhalte als A4-Dokument via [Spatie Browsershot](https://packagist.org/packages/spatie/browsershot) + Headless Chromium
- **Spam-Schutz** für das Kontaktformular via [denkwerk/mosparo-form](https://packagist.org/packages/denkwerk/mosparo-form), Credentials werden via Environment-Variablen injiziert
- **Coolify-Deployment** mit GitHub Actions über einen Tailscale-VPN-Tunnel
- **DDEV** für die lokale Entwicklung

---

## 🧱 Sitepackage-Architektur

Alle projektspezifischen Inhalte liegen in `packages/my_sitepackage/`:

```text
packages/my_sitepackage/
├── Classes/
│   ├── Controller/PdfExportController.php   # PageType 1711, generiert das PDF
│   └── Service/PdfDataService.php           # Datenquellen für den PDF-Export
├── ContentBlocks/ContentElements/           # Content Blocks (Hero, Skills, Projects, …)
│   ├── hero/        ├── projects/
│   ├── skills/      ├── news-article/
│   ├── footer/      ├── news-list/
│   └── pdfexport/                           # ContentBlock mit dem PDF-Export-Formular
├── Configuration/
│   ├── Sets/SitePackage/                    # Site Set (TYPO3 v13+ Standard)
│   ├── TypoScript/setup.typoscript          # PageType 1711 für PDF-Export
│   ├── ViteEntrypoints.json                 # Entry-Points für vite-asset-collector
│   └── Yaml/FormSetup.yaml                  # Eigene Templates für TYPO3 Form Framework
└── Resources/
    ├── Private/JavaScript/Main.entry.js     # Vite-Entry (JS)
    ├── Private/Frontend/Form.entry.scss     # Vite-Entry (SCSS)
    ├── Private/Forms/contact.form.yaml      # Kontakt-Formular mit Mosparo
    └── Private/Templates/Pdf/Summary.html   # Fluid-Template für den PDF-Export
```

### PDF-Export

Der ContentBlock `pdfexport` rendert ein Formular mit Checkboxen für die zu exportierenden Bereiche. Der Submit geht auf eine Seite mit `&type=1711`, die den `PdfExportController::generateAction()` triggert. Dieser holt die Daten via `PdfDataService` direkt aus den Content-Block-Tabellen, rendert das Fluid-Template `Summary.html` und schickt es durch eine lokale Chromium-Instanz (`/usr/bin/chromium`, im Container vorinstalliert).

### Mosparo-Integration

Die mosparo-Credentials kommen ausschließlich über Environment-Variablen — niemals im Repo. `config/system/additional.php` liest die fünf Variablen ein und injiziert sie als TypoScript-Konstanten unter `plugin.tx_mosparoform.settings.projects.portfolio`.

---

## 🛠 Lokale Entwicklung (DDEV)

```bash
# Initial-Setup
ddev start
ddev composer install
ddev npm install
ddev npm run build

# Kontinuierliche Entwicklung
ddev npm run dev   # Vite-Dev-Server mit HMR
```

### Mosparo lokal aktivieren

```bash
cp .ddev/config.local.yaml.example .ddev/config.local.yaml
# Echte Werte aus deinem Mosparo-Backend in .ddev/config.local.yaml eintragen
ddev restart
```

`.ddev/config.local.yaml` wird von DDEV automatisch geignored.

### PDF-Export lokal

Chromium ist über `webimage_extra_packages: ["chromium"]` (siehe `.ddev/config.yaml`) im DDEV-Webcontainer installiert — der Export funktioniert lokal ohne weitere Konfiguration.

---

## 🐳 Docker-Build (Coolify)

Der `Dockerfile` ist auf **maximale Cache-Wiederverwendung** optimiert:

| Stage              | Inhalt                                  | Cache-Verhalten                               |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| `composer-builder` | PHP-Vendor                              | rebuild nur bei `composer.json/lock`-Änderung |
| `vite-builder`     | Frontend-Build (Vite + npm)             | rebuild nur bei `package.json/lock`-Änderung  |
| Production-Image   | Apache + PHP + System-Pakete + Chromium | rebuild nur bei System-Paket-Änderung         |

System-Pakete (Chromium + alle Runtime-Libs + Node.js + locales) sind in **einer einzigen `RUN`-Schicht** zusammengefasst — Folge-Builds nutzen diese komplett aus dem Cache.

Wichtig in Coolify: **"Disable Build Cache" deaktiviert lassen** — sonst wird der Cache-Effekt zerstört.

---

## 🚀 Deployment (Coolify + Tailscale + GitHub Actions)

### Voraussetzungen

- Coolify-Instanz, erreichbar nur über Tailscale (`100.64.0.0/10`)
- GitHub-Repository mit Push-Trigger auf `main`

### Coolify konfigurieren

1. Application aus Git-Repo erstellen, Build Pack: **Dockerfile**
2. **Environment Variables** (Application → Environment Variables):
   - `TYPO3_CONTEXT=Production`
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (oder DSN)
   - `MOSPARO_PUBLIC_SERVER`, `MOSPARO_VERIFY_SERVER`, `MOSPARO_UUID`,
     `MOSPARO_PUBLIC_KEY`, `MOSPARO_PRIVATE_KEY` (alle als **Secret** markieren!)
3. **Deploy Webhook** und **API-Token** kopieren

### GitHub Actions

Repository-Secrets setzen (`Settings → Secrets → Actions`):

- `COOLIFY_WEBHOOK_URL`
- `COOLIFY_TOKEN`
- `TAILSCALE_AUTHKEY` (Reusable + Ephemeral)

Der Workflow in `.github/workflows/` baut Vite-Assets, verbindet sich kurzzeitig per Tailscale und triggert den Coolify-Webhook.

### Initial-Setup auf dem Server

```bash
# DB-Dump aus DDEV importieren
ddev export-db --file=db_dump.sql.gz
scp db_dump.sql.gz user@server:~/
ssh user@server "zcat ~/db_dump.sql.gz | docker exec -i <mariadb-container> \
    mariadb -u root -p<root-pass> default"

# Backend-Admin anlegen (im Coolify-Terminal)
./vendor/bin/typo3 backend:user:create --username admin --admin
```

---

## 🔒 Sicherheit

- **`additional.php`** erkennt Production via `TYPO3_CONTEXT=Production` und aktiviert dann:
  - `displayErrors=0`, leeres `devIPmask`
  - `cookieSecure=2`, `BE/lockSSL=true`
  - Reverse-Proxy-Vertrauen für Traefik
- **Trusted Hosts** sind aktuell auf `.*` gesetzt — bei Bedarf auf konkrete Domain einschränken
- **Mosparo-Keys** liegen ausschließlich in Coolify-Env-Vars, nicht im Repo

---

## 📦 Tech-Stack

- TYPO3 v14.3 / PHP 8.4 / Apache
- MariaDB 11.8
- Vite 7 + `vite-plugin-typo3` 2 + Bootstrap 5.3
- Spatie Browsershot 5 + Chromium (headless, lokal im Container)
- Mosparo Form Protection
- Coolify v4 + Traefik
- Tailscale + GitHub Actions

---

_© Maik Demuth · `connect@maidem.de`_
