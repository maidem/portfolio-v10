---
title: TYPO3 v14 mit DDEV aufsetzen und über Coolify deployen
slug: typo3-v14-ddev-coolify-workflow
date: 2026-05-01
description: Schritt-für-Schritt-Anleitung, wie ich meine Portfolio-Site mit TYPO3 v14, PHP 8.4, Vite und Bootstrap 5 lokal in DDEV aufgesetzt und anschließend über GitHub Actions, Tailscale und einen Coolify-Server live gebracht habe. Inklusive Dockerfile-Struktur, Mosparo-Integration und PDF-Export mit Headless Chromium.
tags:
  - TYPO3
  - DDEV
  - Coolify
  - Docker
  - Tailscale
  - GitHub Actions
---

Das Setup für meine Portfolio-Site sollte zwei Anforderungen gleichzeitig erfüllen: lokal komfortabel mit DDEV entwickeln und produktiv über Coolify auf einem eigenen Server deployen, ohne dass die Build-Zeiten explodieren oder Secrets im Repo landen. Hier ist der komplette Ablauf, so dass jemand das Projekt von Grund auf nachbauen kann.

## Tag 1: Lokales Setup mit DDEV

Bevor irgendetwas TYPO3-spezifisches passiert, steht die Container-Umgebung. DDEV erledigt die komplette lokale Infrastruktur, von Apache über PHP bis MariaDB.

```bash
# DDEV installieren (macOS)
brew install ddev/ddev/ddev
mkcert -install

# Projektverzeichnis anlegen und initialisieren
mkdir portfolio-v1 && cd portfolio-v1
ddev config --project-type=typo3 --docroot=public --php-version=8.4
```

Die generierte `.ddev/config.yaml` wird minimal angepasst, damit alle Anforderungen für TYPO3 v14, Vite und den späteren PDF-Export erfüllt sind:

```yaml
name: portfolio-v1
type: typo3
docroot: public
php_version: "8.4"
webserver_type: apache-fpm
database:
  type: mariadb
  version: "11.8"
composer_version: "2"
nodejs_version: "20"
webimage_extra_packages: ["chromium"]
web_environment:
  - TYPO3_CONTEXT=Development
corepack_enable: false
```

Wichtig ist `webimage_extra_packages: ["chromium"]`. Damit landet Chromium direkt im Webcontainer, was später für `spatie/browsershot` (PDF-Export) gebraucht wird. So muss man lokal nichts extra installieren.

```bash
ddev start
```

## Tag 2: TYPO3 v14 per Composer installieren

TYPO3 v14 wird ausschließlich über Composer aufgesetzt. Die `composer.json` deklariert das Sitepackage als lokales Path-Repository, damit man parallel im Repo daran entwickeln kann:

```json
{
  "name": "typo3/cms-base-distribution",
  "type": "project",
  "config": {
    "allow-plugins": {
      "typo3/class-alias-loader": true,
      "typo3/cms-composer-installers": true
    },
    "platform": { "php": "8.4.0" },
    "sort-packages": true
  },
  "require": {
    "php": ">=8.4.0",
    "typo3/cms-core": "^14.0",
    "typo3/cms-backend": "^14.0",
    "typo3/cms-frontend": "^14.0",
    "typo3/cms-fluid-styled-content": "^14.0",
    "typo3/cms-form": "^14.0",
    "typo3/cms-rte-ckeditor": "^14.0",
    "typo3/cms-seo": "^14.0",
    "friendsoftypo3/content-blocks": "^2.1",
    "praetorius/vite-asset-collector": "^1.15",
    "denkwerk/mosparo-form": "^1.1",
    "spatie/browsershot": "^5.2",
    "gripsraum/my-sitepackage": "@dev"
  },
  "repositories": {
    "packages": { "type": "path", "url": "./packages/*" }
  }
}
```

```bash
ddev composer install
ddev exec touch public/FIRST_INSTALL
```

Anschließend wird `https://portfolio-v1.ddev.site` aufgerufen, der Install-Wizard durchgeklickt, ein Backend-User erstellt — alles Standard.

## Tag 3: Sitepackage und Content Blocks

Das eigene Sitepackage liegt unter `packages/my_sitepackage/` und arbeitet mit den modernen TYPO3-v14-Konzepten **Site Sets** und **Content Blocks** statt klassischem TypoScript-Templating:

```text
packages/my_sitepackage/
├── Classes/
│   ├── Controller/PdfExportController.php
│   └── Service/PdfDataService.php
├── ContentBlocks/ContentElements/
│   ├── hero/        ├── projects/
│   ├── skills/      ├── news-article/
│   ├── footer/      └── pdfexport/
├── Configuration/
│   ├── Sets/SitePackage/
│   ├── TypoScript/setup.typoscript
│   ├── ViteEntrypoints.json
│   └── Yaml/FormSetup.yaml
└── Resources/
    ├── Private/JavaScript/Main.entry.js
    ├── Private/Frontend/Form.entry.scss
    ├── Private/Forms/contact.form.yaml
    └── Private/Templates/Pdf/Summary.html
```

Jeder Content Block ist ein Verzeichnis mit `config.yaml`, `Source/EditorPreview.html`, `Source/Frontend.html` und optional eigenen Assets. Dadurch ist die Definition jedes Blocks im Repo versioniert, in Pull Requests reviewbar und ohne Backend-Klickorgien duplizierbar.

## Tag 4: Vite-Build einbinden

Frontend-Assets werden mit Vite 7 gebaut, eingebunden über das TYPO3-Plugin `praetorius/vite-asset-collector` plus `vite-plugin-typo3`:

```json
{
  "type": "commonjs",
  "scripts": {
    "build": "vite build"
  },
  "devDependencies": {
    "sass-embedded": "^1.98.0",
    "vite": "^7.3.1",
    "vite-plugin-typo3": "^2.1.0"
  },
  "dependencies": {
    "@fontsource/jetbrains-mono": "^5.2.8",
    "bootstrap": "^5.3.8",
    "puppeteer": "^24.40.0"
  }
}
```

`Configuration/ViteEntrypoints.json` listet alle Entry-Points (JS und SCSS) des Sitepackages und weiterer Content Blocks. Im Fluid-Template wird das Asset über `<vac:asset.vite />` eingebunden — das Plugin löst Manifest und Hashed-Filenames automatisch auf.

```bash
ddev npm install
ddev npm run build
```

## Tag 5: Mosparo-Spam-Schutz ohne Secrets im Repo

Das Kontaktformular nutzt `denkwerk/mosparo-form`. Die fünf Mosparo-Credentials dürfen niemals ins Repo. Lösung: `%env()%`-Placeholder direkt in der Site-Settings-YAML, die TYPO3 v14 nativ über den `YamlFileLoader` mit `PROCESS_PLACEHOLDERS` auflöst:

```yaml
# config/sites/main-site/settings.yaml
plugin.tx_mosparoform.settings.projects.default.publicServer: "%env(MOSPARO_PUBLIC_SERVER)%"
plugin.tx_mosparoform.settings.projects.default.verifyServer: "%env(MOSPARO_VERIFY_SERVER)%"
plugin.tx_mosparoform.settings.projects.default.uuid: "%env(MOSPARO_UUID)%"
plugin.tx_mosparoform.settings.projects.default.publicKey: "%env(MOSPARO_PUBLIC_KEY)%"
plugin.tx_mosparoform.settings.projects.default.privateKey: "%env(MOSPARO_PRIVATE_KEY)%"
```

Lokal werden die Werte über eine gitignored DDEV-Datei gesetzt:

```yaml
# .ddev/config.local.yaml — NICHT ins Repo
web_environment:
  - MOSPARO_PUBLIC_SERVER=https://mosparo.example.com
  - MOSPARO_VERIFY_SERVER=https://mosparo.example.com
  - MOSPARO_UUID=...
  - MOSPARO_PUBLIC_KEY=...
  - MOSPARO_PRIVATE_KEY=...
```

```bash
ddev restart
```

In Produktion kommen dieselben Variablen aus den Coolify-Environment-Variables. Im Code muss nichts angepasst werden.

## Tag 6: `additional.php` für DDEV und Coolify gleichzeitig

Eine einzige `config/system/additional.php` deckt beide Welten ab. In DDEV bleibt die Datenbank-Konfiguration unangetastet (DDEV verwaltet das selbst), in Produktion wird sie aus Environment-Variablen aufgebaut. Coolify liefert die DB-URL teilweise als DSN — der Parser fängt beide Fälle ab:

```php
$GLOBALS['TYPO3_CONF_VARS']['SYS']['trustedHostsPattern'] = '.*';

if (!getenv('IS_DDEV_PROJECT')) {
    $mysqlHost = getenv('MYSQL_HOST');
    $dbConfig = [
        'driver' => 'mysqli',
        'host' => '127.0.0.1',
        'port' => 3306,
        'user' => getenv('MYSQL_USER'),
        'password' => getenv('MYSQL_PASSWORD'),
        'dbname' => getenv('MYSQL_DATABASE') ?: 'default',
    ];
    if ($mysqlHost) {
        $dbUrl = parse_url($mysqlHost);
        if (isset($dbUrl['host'])) {
            $dbConfig['host'] = $dbUrl['host'];
            $dbConfig['port'] = $dbUrl['port'] ?? 3306;
            if (isset($dbUrl['user'])) $dbConfig['user'] = $dbUrl['user'];
            if (isset($dbUrl['pass'])) $dbConfig['password'] = $dbUrl['pass'];
            if (isset($dbUrl['path']) && strlen(ltrim($dbUrl['path'], '/')) > 0) {
                $dbConfig['dbname'] = ltrim($dbUrl['path'], '/');
            }
        } else {
            $dbConfig['host'] = $mysqlHost;
        }
    }
    $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] = array_merge(
        $GLOBALS['TYPO3_CONF_VARS']['DB']['Connections']['Default'] ?? [],
        $dbConfig
    );
}

if (getenv('TYPO3_CONTEXT') === 'Production') {
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['displayErrors'] = 0;
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask'] = '';
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['reverseProxy_ips'] = '*';
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['reverseProxy_ssl'] = '*';
    if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
        $_SERVER['HTTPS'] = 'on';
        $_SERVER['SERVER_PORT'] = 443;
    }
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['cookieSecure'] = 2;
    $GLOBALS['TYPO3_CONF_VARS']['BE']['lockSSL'] = true;
}
```

Der Reverse-Proxy-Block ist entscheidend. Ohne `reverseProxy_ips` und das HTTPS-Spoofing aus `X-Forwarded-Proto` läuft man hinter Traefik in Endlos-Redirects oder bekommt im Backend einen „Missing referrer"-Fehler.

## Tag 7: Multi-Stage-Dockerfile für Coolify

Coolify baut produktiv mit dem Dockerfile aus dem Repo. Das Image ist auf maximale Cache-Wiederverwendung optimiert: drei Stages, schwere Layer ganz oben, App-Code ganz unten.

```dockerfile
# Stage 1: PHP-Dependencies
FROM php:8.4-cli-bookworm AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
COPY packages ./packages
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions && install-php-extensions intl zip
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    --ignore-platform-req=ext-gd --ignore-platform-req=ext-pdo_mysql --ignore-platform-req=ext-mysqli

# Stage 2: Frontend-Build
FROM node:22-bookworm-slim AS vite-builder
WORKDIR /app
COPY package.json package-lock.json composer.json composer.lock ./
COPY packages ./packages
COPY --from=composer-builder /app/vendor ./vendor
COPY vite.config.js ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci && npm run build

# Stage 3: Runtime
FROM php:8.4-apache-bookworm
WORKDIR /var/www/html
COPY --from=composer-builder /app/vendor ./vendor/
COPY --from=vite-builder /app/public/_assets ./public/_assets/

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Eine grosse RUN-Schicht für System-Pakete + Chromium + Node + Locales
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl git zip unzip locales gnupg ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends \
        nodejs chromium fonts-liberation \
        libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
        libxkbcommon0 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
        libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    && sed -i -e 's/# de_DE.UTF-8 UTF-8/de_DE.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV LANG=de_DE.UTF-8 LANGUAGE=de_DE:de LC_ALL=de_DE.UTF-8

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions intl gd zip opcache pdo_mysql mysqli soap bcmath exif imagick

RUN a2enmod rewrite headers expires

RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'memory_limit=512M'; \
    echo 'max_execution_time=240'; \
    } > /usr/local/etc/php/conf.d/typo3-recommendations.ini

COPY --chown=www-data:www-data . .
COPY --from=composer-builder --chown=www-data:www-data /app/vendor ./vendor
COPY --from=vite-builder --chown=www-data:www-data /app/public/_assets/vite ./public/_assets/vite

RUN php vendor/bin/typo3 content-blocks:assets:publish \
    && find public/_assets -type l | while read link; do \
        target="$(readlink -f "$link")"; \
        rm "$link"; \
        if [ -e "$target" ]; then cp -a "$target" "$link"; fi; \
    done \
    && mkdir -p var public/fileadmin public/uploads \
        public/typo3temp/assets/css public/typo3temp/assets/js \
        public/typo3temp/assets/images public/typo3temp/assets/_processed_ \
        config/system \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 var public/fileadmin public/uploads public/typo3temp config/system

EXPOSE 80
```

Die passende `.dockerignore` hält den Build-Kontext klein:

```text
.git
.ddev
.idea
.vscode
node_modules
vendor
public/fileadmin/*
public/uploads/*
public/_assets/vite/*
var/*
docker-compose.yaml
.env
.env.*
```

Das Detail mit dem `find … -type l`-Aufruf ist wichtig: Die Content-Blocks-Asset-Publishing-Routine erzeugt Symlinks, die bei späteren `COPY`-Operationen oder Volume-Mounts brechen. Die Schleife löst sie in echte Kopien auf.

## Tag 8: Coolify konfigurieren

Coolify läuft bei mir auf einem Server, der nur per Tailscale erreichbar ist. In der Coolify-UI:

1. Neue **Application** aus dem GitHub-Repo erstellen, Build Pack: **Dockerfile**.
2. **Environment Variables** anlegen — alle Secrets als „Secret" markieren:
   - `TYPO3_CONTEXT=Production`
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (oder DSN-URL als `MYSQL_HOST`)
   - `MOSPARO_PUBLIC_SERVER`, `MOSPARO_VERIFY_SERVER`, `MOSPARO_UUID`, `MOSPARO_PUBLIC_KEY`, `MOSPARO_PRIVATE_KEY`
3. Eine **MariaDB-Resource** anlegen, Coolify gibt die Connection-Daten in die Environment-Variables ein.
4. Persistente **Storage-Volumes** für `public/fileadmin`, `public/uploads`, `var/` und `config/system` anlegen, damit User-Uploads und Settings deployment-übergreifend bleiben.
5. **Deploy Webhook** und **API Token** aus den Application-Settings kopieren.
6. „Disable Build Cache" deaktiviert lassen — sonst bringt das Multi-Stage-Dockerfile keinen Cache-Vorteil.

## Tag 9: GitHub Actions mit Tailscale-Tunnel

Da der Coolify-Server nicht öffentlich erreichbar ist, baut sich der GitHub-Runner kurzzeitig per Tailscale ein, triggert den Webhook und trennt die Verbindung wieder.

Repository-Secrets (`Settings → Secrets → Actions`):

- `COOLIFY_WEBHOOK_URL`
- `COOLIFY_TOKEN`
- `TAILSCALE_AUTHKEY` (Reusable + Ephemeral)

Workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: "8.4"
          extensions: mbstring, intl, pdo, mysqli, zip, gd
          tools: composer:v2

      - run: composer install --no-dev --optimize-autoloader

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - run: npm ci
      - run: npm run build

      - name: Connect to Tailscale
        uses: tailscale/github-action@v3
        with:
          authkey: ${{ secrets.TAILSCALE_AUTHKEY }}

      - name: Trigger Coolify Deploy
        run: |
          curl --silent --show-error --fail-with-body \
            --request GET \
            --url "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
            --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

Der vorgeschaltete Composer- und Vite-Build im Runner ist optional — Coolify würde im Container ohnehin neu bauen — verifiziert aber, dass die Anwendung baut, bevor überhaupt deployed wird. Schlägt der Build im Runner fehl, wird Coolify gar nicht erst angetriggert.

## Tag 10: Initialer DB-Import und Backend-User

Beim ersten Deploy ist die Datenbank leer. Ein DDEV-Dump füllt sie:

```bash
# Lokal
ddev export-db --file=db_dump.sql.gz
scp db_dump.sql.gz user@server-via-tailscale:~/

# Auf dem Server (im DB-Container)
ssh user@server-via-tailscale \
  "zcat ~/db_dump.sql.gz | docker exec -i <mariadb-container> \
   mariadb -u root -p<root-pass> default"
```

Backend-Admin im Coolify-Application-Terminal anlegen:

```bash
./vendor/bin/typo3 backend:user:create --username admin --admin
```

## Was die Stabilität bringt

Drei Entscheidungen haben sich rückblickend als die wichtigsten erwiesen.

**Erstens, Environment-Variablen über `%env()%`-Placeholder direkt in der Site-Settings-YAML.** Keine PHP-Injection, kein Wrapper-Code, kein Drift zwischen DDEV und Coolify. Dieselbe Variable, dieselbe YAML, einmal lokal, einmal in der Coolify-UI gesetzt.

**Zweitens, `IS_DDEV_PROJECT` als Schalter in `additional.php`.** DDEV setzt diese Variable automatisch. Damit bleibt die DB-Konfiguration in DDEV unangetastet (DDEV macht das besser als jede manuelle Logik), während die Produktivkonfiguration sauber aus Coolify-Vars aufgebaut wird — ohne `if-else`-Stapel oder doppelte Pflege.

**Drittens, das Multi-Stage-Dockerfile mit den richtigen Layern in der richtigen Reihenfolge.** Wenn nur Application-Code geändert wird, sind die schweren Stages (System-Pakete, Chromium, Composer, Vite) komplett gecached. Ein typischer Produktiv-Build dauert dadurch unter zwei Minuten statt zwölf.

Sobald diese drei Bausteine stehen, wird Deployment trivial: `git push origin main` — und drei Minuten später läuft die neue Version auf dem Server, die Mosparo-Integration funktioniert, der PDF-Export rendert über Headless Chromium, und das Backend ist über HTTPS hinter Traefik erreichbar. Mehr soll lokales Entwickeln plus Deployment auch nicht sein.
