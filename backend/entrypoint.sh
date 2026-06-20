#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
while ! nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  sleep 1
done
echo "PostgreSQL is ready!"

AUTO_MIGRATE=${AUTO_MIGRATE:-true}
AUTO_SEED=${AUTO_SEED:-true}

if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "Applying database migrations..."
  python manage.py migrate --noinput
else
  echo "Skipping migrations (AUTO_MIGRATE=$AUTO_MIGRATE)."
fi

if [ "$AUTO_SEED" = "true" ]; then
  echo "Running seeders..."
  python manage.py seed || true
else
  echo "Skipping seeders (AUTO_SEED=$AUTO_SEED)."
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

exec "$@"
