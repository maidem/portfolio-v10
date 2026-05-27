#!/bin/bash
set -e

# Fix ownership of bind-mounted directories.
# The host (Coolify) creates these as root when they don't exist yet,
# so we chown them at every container start before Apache runs.
chown -R www-data:www-data \
    /var/www/html/var \
    /var/www/html/public/fileadmin \
    /var/www/html/public/typo3temp 2>/dev/null || true

# Remove stale serialized TCA/system cache files that can cause
# "Typed property must not be accessed before initialization" errors
# when ContentBlocks or other extensions add new readonly class properties.
# Must happen BEFORE cache:flush, because a broken bootstrap prevents flush.
rm -rf /var/www/html/var/cache/* 2>/dev/null || true

# Flush ALL TYPO3 caches on every start (including TypoScript/system caches)
# to ensure config changes (e.g. Site Set dependencies) take effect immediately.
cd /var/www/html && su -s /bin/bash www-data -c \
    "php vendor/bin/typo3 cache:flush 2>/dev/null || true"

# Run DB schema migrations (adds missing tables/columns from extensions).
# Safe to run on every start: only adds, never removes.
# Run as www-data so generated cache files are owned by the web user.
# stderr is NOT suppressed so failures appear in Docker/Coolify container logs.
cd /var/www/html && su -s /bin/bash www-data -c \
    "php vendor/bin/typo3 extension:setup 2>&1" || \
    echo "[docker-entrypoint] WARNING: extension:setup exited non-zero – check output above"

# One-time DB seed import.
# Runs only if db/seed.sql.gz exists AND the flag file is absent (first start only).
# The flag is stored in /var/www/html/var/ which is a bind-mounted volume, so it
# persists across container restarts and redeployments.
DB_SEED_GZ="/var/www/html/db/seed.sql.gz"
DB_SEED_SQL="/var/www/html/db/seed.sql"
DB_SEED_FLAG="/var/www/html/var/db_seed_imported.flag"
if [ -f "$DB_SEED_GZ" ] && [ ! -f "$DB_SEED_FLAG" ]; then
    echo "[docker-entrypoint] Running one-time DB seed import..."
    gzip -d -c "$DB_SEED_GZ" > "$DB_SEED_SQL"
    php /var/www/html/db/importer.php && \
        touch "$DB_SEED_FLAG" && \
        echo "[docker-entrypoint] DB seed import completed successfully." || \
        echo "[docker-entrypoint] WARNING: DB seed import failed – check output above."
    rm -f "$DB_SEED_SQL"
fi

exec docker-php-entrypoint "$@"
