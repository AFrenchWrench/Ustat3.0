from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = "Check database connection"

    def handle(self, *args, **options):
        try:
            connections["default"].cursor()
            self.stdout.write(self.style.SUCCESS("Database is available"))
        except OperationalError:
            self.stdout.write(self.style.ERROR("Database is not available"))
