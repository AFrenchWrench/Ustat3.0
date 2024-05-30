# celery.py
from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Instantiate Celery
app = Celery("config")

# Configure Celery to use the Django settings file
app.config_from_object("django.conf:settings", namespace="CELERY")

# Automatically discover tasks from installed apps
app.autodiscover_tasks()
