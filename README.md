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

## 🚀 Anleitung: Auto-Deploy in 5 Minuten (Vite + Tailscale)

### 1. Repository vorbereiten
1. Markiere dieses Repository auf GitHub unter **Settings** als **Template repository**.
2. Erstelle per "Use this template" Button ein neues Kundenprojekt.
3. Ändere lokal in `.ddev/config.yaml` den Projektnamen (z.B. von `name: portfolio-v1` zu `name: neues-projekt`).

### 2. Coolify & Firewall Setup
Dein Coolify-Server ist per **Tailscale** unsichtbar aus dem öffentlichen Netz.
1. Lege in Coolify das neue GitHub-Projekt an (SSH Key oder Git App).
2. Gehe in Coolify auf **Settings -> Advanced**:
   - Haken setzen bei **API Access**.
   - Trage unter "Allowed IPs for API Access" genau `100.64.0.0/10` ein (Das erlaubt API-Zugriffe nur aus deinem sicheren Tailscale-VPN).
3. Gehe in Coolify auf **Keys & Tokens**:
   - Erstelle einen neuen Token mit dem Haken bei **deploy** und kopiere ihn.
4. Gehe in Coolify auf deinen Projekt-Reiter **Webhooks**:
   - Kopiere die angezeigte URL unter **Deploy Webhook (auth required)** (z.B. `http://100.x.x.x:8000/api/v1/deploy?...`).

### 3. GitHub Actions konfigurieren (Secrets)
Da GitHub für dich die Frontend-Assets (`npm run build` via Vite) baut, musst du dem GitHub Runner Zugang zu Coolify gewähren:
Gehe auf GitHub zu `Settings -> Secrets and variables -> Actions` und erstelle:
- `COOLIFY_WEBHOOK_URL`: Die kopierte URL aus Schritt 2.4.
- `COOLIFY_TOKEN`: Der kopierte Token aus Schritt 2.3.
- `TAILSCALE_AUTHKEY`: Ein frischer Auth-Key aus deinem Tailscale Admin Panel (Reusable + Ephemeral).

**Fertig!** Sobald du nun Änderungen auf `main` pushst, loggt sich GitHub kurz per Tailscale in dein VPN ein, baut deine Vite-Assets, pingt Coolify über die interne IP an und loggt sich rückstandslos wieder aus. Vollautomatisch.

### 4. Datenbank & Backend User
Um deine lokalen Daten auf den Server zu bekommen:
```bash
# Lokal (DDEV)
ddev export-db --file=db_dump.sql.gz

# Datei hochladen und importieren
scp db_dump.sql.gz user@server:~/
ssh user@server "zcat ~/db_dump.sql.gz | docker exec -i <mariadb-container-id> mariadb -u root -p<root-pass> default"

# Admin anlegen (im Coolify Terminal)
./vendor/bin/typo3 backend:user:create --username admin --admin
```

---

## 📝 Portfolio-Artikel / Blog
Dieses Setup demonstriert modernes **DevOps für PHP/TYPO3**. Es kombiniert intelligente Laufzeit-Konfigurationen mit einem Zero-Downtime, hochsicheren Deployment-Workflow über Tailscale VPN.

**Verwendeter Tech-Stack:**
- TYPO3 v14 + PHP 8.5
- Vite (Frontend Asset Compilation + HMR)
- Coolify (Self-hosted Vercel/Heroku Alternative)
- GitHub Actions (CI/CD Pipeline)
- Tailscale (Carrier-Grade NAT VPN zur Absicherung des Deploy-Ports)

---
*Erstellt mit ❤️ für effiziente TYPO3-Workflows.*
