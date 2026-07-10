# Stage 1: Build PHP dependencies
FROM php:8.4-cli-bookworm AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
COPY packages ./packages

# Install system extensions for intl/zip via official installer
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions intl zip

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-req=ext-gd --ignore-platform-req=ext-pdo_mysql --ignore-platform-req=ext-mysqli

# Stage 2: Build Frontend assets with Node/Vite
FROM node:24-bookworm-slim AS vite-builder
WORKDIR /app
COPY package.json package-lock.json composer.json composer.lock ./
COPY packages ./packages
COPY --from=composer-builder /app/vendor ./vendor
COPY vite.config.js ./
# Skip Puppeteer Chrome download — Chromium runs as a separate service at runtime
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci
RUN npm run build

# Stage 3: Project Image
FROM php:8.4-apache-bookworm

# Set working directory
WORKDIR /var/www/html

# FORCE SEQUENTIAL BUILD: Copy from builders first.
# This forces Docker to finish the heavy composer/vite stages before starting the heavy system-installs in this stage.
# node_modules is NOT copied: it's only needed inside vite-builder. In production the
# vite-asset-collector reads the prebuilt public/_assets/vite manifest (useDevServer=0),
# and PDF export drives system chromium (/usr/bin/chromium), not Puppeteer.
COPY --from=composer-builder /app/vendor ./vendor/
COPY --from=vite-builder /app/public/_assets ./public/_assets/

# Configure Apache
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# ─────────────────────────────────────────────────────────────────────────────
# System packages — combined into ONE layer for maximum cache reuse.
# Order: install everything that almost never changes (apt packages, locales,
# Chromium runtime libs) so this huge layer gets cached after the first build
# and only re-runs when this exact RUN block changes.
#
# Includes:
#   - base utilities (curl, git, zip, unzip, locales, gnupg)
#   - Node.js 24 (via NodeSource)
#   - Chromium + all required runtime libraries for headless PDF rendering
#     (Browsershot drives /usr/bin/chromium directly; no remote service)
# ─────────────────────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl git zip unzip locales gnupg ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends \
        nodejs \
        chromium \
        fonts-liberation \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        libpango-1.0-0 \
        libcairo2 \
    && sed -i -e 's/# de_DE.UTF-8 UTF-8/de_DE.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=de_DE.UTF-8
ENV LANGUAGE=de_DE:de
ENV LC_ALL=de_DE.UTF-8

# Use official PHP extension installer for the remaining extensions
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions intl \
    && install-php-extensions gd zip opcache pdo_mysql mysqli soap bcmath exif imagick

# Enable Apache modules
RUN a2enmod rewrite headers expires

# Set recommended PHP.ini settings (moved up — never changes, stays cached)
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'memory_limit=512M'; \
    echo 'max_execution_time=240'; \
    } > /usr/local/etc/php/conf.d/typo3-recommendations.ini

# ─────────────────────────────────────────────────────────────────────────────
# Application code — everything below changes on (almost) every commit.
# Keep this section as small and fast as possible.
# ─────────────────────────────────────────────────────────────────────────────

# Copy the rest of the application
COPY --chown=www-data:www-data . .

# Overwrite vendor/ with built version (the COPY . . above contained
# broken symlinks from .dockerignore'd vendor/).
COPY --from=composer-builder --chown=www-data:www-data /app/vendor ./vendor
COPY --from=vite-builder --chown=www-data:www-data /app/public/_assets/vite ./public/_assets/vite

# Publish ContentBlock assets, resolve symlinks, create runtime dirs and fix
# ownership — combined into ONE layer to reduce image size and build time.
RUN php vendor/bin/typo3 content-blocks:assets:publish \
    && find public/_assets -type l | while read link; do \
        target="$(readlink -f "$link")"; \
        rm "$link"; \
        if [ -e "$target" ]; then cp -r --dereference "$target" "$link"; fi; \
    done \
    && mkdir -p var public/fileadmin public/uploads \
        public/typo3temp/assets/css public/typo3temp/assets/js \
        public/typo3temp/assets/images public/typo3temp/assets/_processed_ \
        config/system \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 var public/fileadmin public/uploads public/typo3temp config/system \
    && chmod -R a+rX public/_assets

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]

EXPOSE 80
