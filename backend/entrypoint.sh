#!/bin/bash

# Collect static files
# python manage.py collectstatic --noinput

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
    sleep 1
done
echo "PostgreSQL is ready."

# Apply database migrations
python manage.py migrate

exec "$@"