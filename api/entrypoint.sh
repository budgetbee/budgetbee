#!/bin/bash
set -e

# ------------------------------------------------------------------
# Zero-Config entrypoint for BudgetBee (Laravel self-hosted)
# All persistent state lives in /config (mounted as a Docker volume).
# ------------------------------------------------------------------

CONFIG_DIR="/config"
LOGS_DIR="${CONFIG_DIR}/logs"
ENV_FILE="${CONFIG_DIR}/.env"
APP_ENV_FILE="/var/www/html/.env"
STORAGE_LOGS="/var/www/html/storage/logs"

# 0. Guard: /config must be a mounted volume, not a plain directory
ROOT_DEV=$(stat -c '%d' /)
CONFIG_DEV=$(stat -c '%d' "$CONFIG_DIR" 2>/dev/null || echo "$ROOT_DEV")
if [ "$ROOT_DEV" = "$CONFIG_DEV" ]; then
    echo "=============================================="
    echo "  ERROR: /config volume is NOT mounted!"
    echo "=============================================="
    echo ""
    echo "  BudgetBee now requires a persistent volume for"
    echo "  configuration and logs. Update your docker-compose.yml:"
    echo ""
    echo "  services:"
    echo "    webserver:"
    echo "      volumes:"
    echo "        - budgetbee_config:/config"
    echo ""
    echo "  volumes:"
    echo "    budgetbee_config:"
    echo ""
    echo "  See: https://github.com/budgetbee/budgetbee"
    echo "=============================================="
    echo "[entrypoint] Sleeping indefinitely — fix your docker-compose.yml and restart"
    exec sleep infinity
fi

# 1. Ensure /config/logs exists on the persistent volume
mkdir -p "$LOGS_DIR"

# 2. If /config/.env does not exist, seed it from .env.example
if [ ! -f "$ENV_FILE" ]; then
    echo "[entrypoint] No .env found in /config — creating from .env.example"
    cp /var/www/html/.env.example "$ENV_FILE"
fi

# 3. Symlink /config/.env → /var/www/html/.env so Laravel reads it natively
rm -f "$APP_ENV_FILE"
ln -s "$ENV_FILE" "$APP_ENV_FILE"

# 4. Generate APP_KEY only if it's missing or still empty
if grep -qE '^APP_KEY=base64:.+' "$ENV_FILE"; then
    echo "[entrypoint] APP_KEY already set — skipping key:generate"
else
    echo "[entrypoint] No valid APP_KEY found — generating one now"
    php artisan key:generate --force
fi

# 5. Redirect Laravel's storage/logs → /config/logs (persistent)
rm -rf "$STORAGE_LOGS"
ln -s "$LOGS_DIR" "$STORAGE_LOGS"

# 6. Fix ownership and permissions on the persistent config volume
chown -R www-data:www-data "$CONFIG_DIR"
chmod 750 "$CONFIG_DIR"
chmod 640 "$ENV_FILE"
chmod -R 775 "$LOGS_DIR"

# 7. Wait for MySQL, then run migrations (with retry)
echo "[entrypoint] Waiting for MySQL to be ready..."
RETRIES=30
set +e
until php artisan migrate --force --seed 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ "$RETRIES" -le 0 ]; then
        echo "[entrypoint] MySQL not reachable after 30 attempts — exiting"
        exit 1
    fi
    echo "[entrypoint] MySQL not ready yet — retrying in 2s ($RETRIES attempts left)"
    sleep 2
done
set -e

# 8. Start PHP-FPM
exec php-fpm