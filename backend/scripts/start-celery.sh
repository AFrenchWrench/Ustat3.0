#!/bin/sh

# Create a non-root user and run Celery as this user
adduser --disabled-password --gecos "" celeryuser
chown -R celeryuser:celeryuser /app/

# Switch to the new user and start Celery
su celeryuser -c "celery -A config worker --loglevel=info"
# celery -A config worker -l info --pool=solo
