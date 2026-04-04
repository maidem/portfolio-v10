# Stage 1: Build PHP dependencies
FROM php:8.5-cli-bookworm AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
COPY packages ./packages

# Install system dependencies for intl/zip
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libzip-dev \
    git \
    unzip \
    && docker-php-ext-install intl zip

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-req=ext-gd --ignore-platform-req=ext-pdo_mysql --ignore-platform-req=ext-mysqli

# Stage 2: Build Frontend assets with Node/Vite
FROM node:22-bookworm-slim AS vite-builder
WORKDIR /app
COPY package.json package-lock.json composer.json composer.lock ./
COPY packages ./packages
COPY --from=composer-builder /app/vendor ./vendor
COPY vite.config.js ./
RUN npm ci
RUN npm run build

# Stage 3: Project Image
FROM php:8.5-apache-bookworm
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

# Install system utilities and PHP extension installer
RUN apt-get update && apt-get install -y \
    curl \
    git \
    zip \
    unzip \
    locales \
    && sed -i -e 's/# de_DE.UTF-8 UTF-8/de_DE.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=de_DE.UTF-8
ENV LANGUAGE=de_DE:de
ENV LC_ALL=de_DE.UTF-8

# Use the official PHP extension installer for robust builds
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions gd intl zip opcache pdo_mysql mysqli soap bcmath exif imagick

# Enable Apache modules
RUN a2enmod rewrite headers expires

# Update Apache configuration
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

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

WORKDIR /var/www/html

# Copy project files with correct ownership
COPY --chown=www-data:www-data . .
COPY --from=composer-builder --chown=www-data:www-data /app/vendor ./vendor
COPY --from=vite-builder --chown=www-data:www-data /app/public/_assets/vite ./public/_assets/vite

# Ensure specific TYPO3 directories exist and are writable
RUN mkdir -p var public/fileadmin public/uploads config/system \
    && chown -R www-data:www-data var public/fileadmin public/uploads config/system \
    && chmod -R 775 var public/fileadmin public/uploads config/system

EXPOSE 80
