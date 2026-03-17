# Stage 1: Build PHP dependencies
FROM php:8.5-cli-alpine AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
COPY packages ./packages
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Stage 2: Build Frontend assets with Node/Vite
FROM node:22-alpine AS vite-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY vite.config.js ./
RUN npm ci
RUN npm run build

# Stage 3: Project Image
FROM php:8.5-apache-bookworm
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

# Install system dependencies (ImageMagick, GraphicsMagick, Ghostscript for PDF processing)
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libzip-dev \
    libicu-dev \
    libxml2-dev \
    libmagickwand-dev \
    imagemagick \
    graphicsmagick \
    ghostscript \
    zip \
    unzip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
    gd \
    intl \
    zip \
    opcache \
    pdo_mysql \
    mysqli \
    soap \
    bcmath \
    exif

# Install ImageMagick extension (PECL)
RUN pecl install imagick && docker-php-ext-enable imagick

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
    echo 'memory_limit=256M'; \
    echo 'max_execution_time=240'; \
    } > /usr/local/etc/php/conf.d/typo3-recommendations.ini

WORKDIR /var/www/html

# Copy all project files
COPY . .

# Overwrite vendor and built assets from builders
COPY --from=composer-builder /app/vendor ./vendor
COPY --from=vite-builder /app/public/_assets/vite ./public/_assets/vite

# Set permissions
RUN chown -R www-data:www-data .
RUN chmod -R 775 .

EXPOSE 80
