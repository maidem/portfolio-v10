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
FROM node:22-bookworm-slim AS vite-builder
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
COPY --from=composer-builder /app/vendor ./vendor/
COPY --from=vite-builder /app/public/_assets ./public/_assets/
COPY --from=vite-builder /app/node_modules ./node_modules/

# Configure Apache
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Now that the other stages are done, we can use the remaining RAM for the system installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    zip \
    unzip \
    locales \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends \
    nodejs \
    && sed -i -e 's/# de_DE.UTF-8 UTF-8/de_DE.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=de_DE.UTF-8
ENV LANGUAGE=de_DE:de
ENV LC_ALL=de_DE.UTF-8
# Chromium runs as a separate service; Puppeteer connects to it via CDP (remote debugging port).
# The host/port can be overridden via BROWSERSHOT_CHROME_HOST / BROWSERSHOT_CHROME_PORT env vars.
ENV BROWSERSHOT_CHROME_HOST=chromium
ENV BROWSERSHOT_CHROME_PORT=9222

# Use official PHP extension installer again for the remaining extensions
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions
# Install intl first and alone — it compiles ICU from source and is very memory-intensive.
# Isolating it in its own RUN prevents OOM during the linker step.
RUN install-php-extensions intl
# Install the remaining extensions after intl is done and memory is released.
RUN install-php-extensions gd zip opcache pdo_mysql mysqli soap bcmath exif imagick

# Enable Apache modules
RUN a2enmod rewrite headers expires

# Copy the rest of the application
COPY --chown=www-data:www-data . .

# Overwrite vendor/ and node_modules/ with built versions (the COPY . . above contained
# broken symlinks from .dockerignore'd vendor/ and node_modules/).
COPY --from=composer-builder --chown=www-data:www-data /app/vendor ./vendor
COPY --from=vite-builder --chown=www-data:www-data /app/node_modules ./node_modules
COPY --from=vite-builder --chown=www-data:www-data /app/public/_assets/vite ./public/_assets/vite

# Set recommended PHP.ini settings
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

# Publish ContentBlock assets (copies CSS/JS from packages/ to public/_assets/)
# These are gitignored in public/_assets but must exist at runtime.
RUN php vendor/bin/typo3 content-blocks:assets:publish

# Resolve ALL symlinks under public/_assets/ into real files/directories.
# TYPO3/Composer creates deep symlink chains (public/_assets/HASH -> vendor -> packages/...)
# which Apache cannot follow. We replace every symlink with a copy of its target.
RUN find public/_assets -type l | while read link; do \
      target="$(readlink -f "$link")"; \
      rm "$link"; \
      if [ -d "$target" ]; then \
        cp -a "$target" "$link"; \
      elif [ -f "$target" ]; then \
        cp -a "$target" "$link"; \
      fi; \
    done

# Ensure specific TYPO3 directories exist and are writable
# public/typo3temp is gitignored but required at runtime for TYPO3's compressed CSS/JS output.
RUN mkdir -p var public/fileadmin public/uploads public/typo3temp/assets/css public/typo3temp/assets/js public/typo3temp/assets/images public/typo3temp/assets/_processed_ config/system \
    && chown -R www-data:www-data var public/fileadmin public/uploads public/typo3temp config/system \
    && chmod -R 775 var public/fileadmin public/uploads public/typo3temp config/system

# Final ownership fix
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
