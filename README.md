# Portfolio (TYPO3 v14)

Persönliche Portfolio-Website, gebaut mit **TYPO3 v14**, **PHP 8.4**, **Vite** und **Bootstrap 5**, deployed via **Coolify** auf einem Tailscale-gesicherten Server.

## Stack

- TYPO3 v14.3 / PHP 8.4 / Apache
- MariaDB 11.8
- Vite 7 + `vite-plugin-typo3` + Bootstrap 5.3
- Spatie Browsershot 5 + Chromium (headless)
- Mosparo spam protection
- Coolify v4 + Traefik + Tailscale + GitHub Actions

## Features

- **Content Blocks** statt klassischem TypoScript-Templating
- **PDF-Export** als A4-Dokument via `gripsraum/pdf-export` (siehe [`packages/gripsraum_pdfexport/README.md`](packages/gripsraum_pdfexport/README.md))
- **Mosparo** Spam-Schutz für das Kontaktformular — Credentials via Environment-Variablen
- **Coolify-Deployment** über Tailscale-VPN-Tunnel mit GitHub Actions

## Lokale Entwicklung (DDEV)

```bash
ddev start
ddev npm run dev       # Vite Dev-Server
ddev npm run build     # Produktions-Build
ddev exec vendor/bin/typo3 cache:flush
```

Chromium ist via `webimage_extra_packages: ["chromium"]` im DDEV-Container vorinstalliert — der PDF-Export funktioniert lokal ohne weitere Konfiguration.

## Sitepackage

Alle projektspezifischen Inhalte liegen in `packages/my_sitepackage/`. Content Blocks unter `packages/my_sitepackage/ContentBlocks/ContentElements/`.

## Deployment (Coolify)

1. Application aus Git-Repo erstellen, Build Pack: **Dockerfile**
2. Environment Variables setzen:
   - `TYPO3_CONTEXT=Production`
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - `MOSPARO_PUBLIC_SERVER`, `MOSPARO_VERIFY_SERVER`, `MOSPARO_UUID`, `MOSPARO_PUBLIC_KEY`, `MOSPARO_PRIVATE_KEY`
3. GitHub Actions Secrets: `COOLIFY_WEBHOOK_URL`, `COOLIFY_TOKEN`, `TAILSCALE_AUTHKEY`

