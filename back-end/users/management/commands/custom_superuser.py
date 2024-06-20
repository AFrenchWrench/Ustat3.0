from decouple import config
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = 'Create a superuser with custom fields'

    def handle(self, *args, **kwargs):
        try:
            user = get_user_model().objects.create_superuser(
                username=config("SUPERUSERNAME"),
                email=config("EMAIL"),
                phone_number=config("PHONE_NUMBER"),
                landline_number=config("LANDLINE_NUMBER"),
                first_name=config("FIRST_NAME"),
                last_name=config("LAST_NAME"),
                birthdate=config("BIRTHDATE"),
                password=config("PASSWORD"),
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser {user.username} created successfully'))
        except ValidationError as e:
            self.stderr.write(self.style.ERROR(f'Error: {e}'))
