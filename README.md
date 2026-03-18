# TYPO3 v14 & Coolify Deployment Blueprint 🚀

Dieses Repository dient als hoch-optimierte Schablone für das Deployment von **TYPO3 v14** auf modernen Cloud-Infrastrukturen via **Coolify**. Es löst die typischen Probleme bei der Containerisierung von TYPO3 und sorgt für einen blitzschnellen, sicheren Workflow.

---

## ✨ Features der Schablone

- **PHP 8.5 Ready**: Volle Unterstützung für die neueste PHP-Generation auf Debian Bookworm Basis.
- **Auto-Config MariaDB**: Die `additional.php` erkennt automatisch Coolify-Datenbank-Strings (DSN-URLs) und Hostnamen.
- **Smart Reverse Proxy**: Integrierte Logik für Traefik/Coolify. Verhindert Redirect-Loops und fixiert den "Missing Referrer"-Fehler beim Login.
- **Blitzschneller Build**: 
  - Multi-Stage Docker-Build (Composer -> Vite -> Apache).
  - Nutzung des offiziellen `php-extension-installer` für maximale Stabilität.
  - Optimierte `.dockerignore` und Dateiberechtigungen (`--chown` während `COPY`).
- **Production Hardening**: SSL-Zwang fürs Backend und sichere Cookie-Einstellungen vorkonfiguriert.

---

## 🛠 Technische Highlights

### 1. PHP Extension Installer
Statt mühsam Abhängigkeiten manuell zu installieren, nutzt dieses Projekt das Skript von `mlocati`. Das garantiert, dass alle TYPO3-Abhängigkeiten (GD, Intl, Zip, Imagick, etc.) sauber kompiliert werden, ohne den Build-Prozess durch Race-Conditions abzubrechen.

### 2. Intelligente `additional.php`
Die Datei in `config/system/additional.php` ist das Herzstück. Sie unterscheidet zwischen lokaler Entwicklung (**DDEV**) und Produktion (**Coolify**). Sie parst komplexe Datenbank-URLs und setzt Proxy-Header so um, dass TYPO3 intern weiß, dass es über HTTPS erreichbar ist.

---

## 🚀 Anleitung: In 5 Minuten live

### 1. Repository vorbereiten
1. Markiere dieses Repository auf GitHub als **Template**.
2. Erstelle ein neues Projekt aus diesem Template.

### 2. Coolify Setup
1. Lege in Coolify ein neues Projekt an.
2. Füge eine **MariaDB Datenbank** hinzu.
3. Füge eine **Public Repository App** (dein neues GitHub-Repo) hinzu.
4. Setze den **Service Port** der App auf `80`.

### 3. Umgebungsvariablen (App-Einstellungen)
Trage folgende Variablen in Coolify unter "Environment Variables" ein:
- `MYSQL_HOST`: (Wird meist automatisch von Coolify verlinkt)
- `MYSQL_DATABASE`: `default` (oder dein DB-Name)
- `MYSQL_USER`: `maidem` (dein DB-User)
- `MYSQL_PASSWORD`: `****` (dein DB-Passwort)
- `TYPO3_CONTEXT`: `Production`

### 4. Datenbank-Import (DDEV -> Live)
Um deine lokalen Daten auf den Server zu bekommen:
```bash
# Lokal (DDEV)
ddev export-db --file=db_dump.sql.gz

# Datei hochladen und importieren
scp db_dump.sql.gz user@server:~/
ssh user@server "zcat ~/db_dump.sql.gz | docker exec -i <mariadb-container-id> mariadb -u root -p<root-pass> default"
```

### 5. Backend Admin anlegen
Nutze den modernen TYPO3 v14 Weg direkt über das Coolify-Terminal:
```bash
./vendor/bin/typo3 backend:user:create --username admin --admin
```

---

## 📝 Portfolio-Artikel / Blog
Dieses Setup demonstriert modernes **DevOps für PHP/TYPO3**. Es kombiniert Containerisierung mit intelligenten Laufzeit-Konfigurationen, um eine "Zero-Config" Deployment-Erfahrung zu schaffen.

**Verwendete Tech-Stack:**
- TYPO3 v14
- PHP 8.5 (Apache/Debian)
- Docker (Multi-Stage)
- Coolify (Open-Source Heroku/Vercel Alternative)

---
*Erstellt mit ❤️ für effiziente TYPO3-Workflows.*
