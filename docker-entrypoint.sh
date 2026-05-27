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
cd /var/www/html && su -s /bin/bash www-data -c \
    "php vendor/bin/typo3 extension:setup --silent 2>/dev/null || true"

exec docker-php-entrypoint "$@"
