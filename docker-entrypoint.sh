#!/bin/bash
set -e

# Fix ownership of bind-mounted directories.
# The host (Coolify) creates these as root when they don't exist yet,
# so we chown them at every container start before Apache runs.
chown -R www-data:www-data \
    /var/www/html/var \
    /var/www/html/public/fileadmin \
    /var/www/html/public/typo3temp 2>/dev/null || true

exec docker-php-entrypoint "$@"
