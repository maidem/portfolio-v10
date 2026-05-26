#!/bin/bash
set -e

# Fix ownership of bind-mounted directories.
# The host (Coolify) creates these as root when they don't exist yet,
# so we chown them at every container start before Apache runs.
chown -R www-data:www-data \
    /var/www/html/var \
    /var/www/html/public/fileadmin \
    /var/www/html/public/typo3temp 2>/dev/null || true

# Flush ALL TYPO3 caches on every start (including TypoScript/system caches)
# to ensure config changes (e.g. Site Set dependencies) take effect immediately.
cd /var/www/html && su -s /bin/bash www-data -c \
    "php vendor/bin/typo3 cache:flush 2>/dev/null || true"

exec docker-php-entrypoint "$@"
