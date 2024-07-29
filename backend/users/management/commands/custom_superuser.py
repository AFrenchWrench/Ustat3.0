from decouple import config
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from main.models import Cities


class Command(BaseCommand):
    help = "Create a superuser with custom fields"

    def handle(self, *args, **kwargs):
        try:
            User = get_user_model()
            try:
                user = User.objects.get(username=config("SUPERUSERNAME"))
                self.stdout.write(
                    self.style.ERROR(f"User with the username {user.username} exists!")
                )
            except User.DoesNotExist:
                user = User.objects.create_superuser(
                    username=config("SUPERUSERNAME"),
                    email=config("EMAIL"),
                    phone_number=config("PHONE_NUMBER"),
                    landline_number=config("LANDLINE_NUMBER"),
                    first_name=config("FIRST_NAME"),
                    last_name=config("LAST_NAME"),
                    birthdate=config("BIRTHDATE"),
                    password=config("PASSWORD"),
                    city=get_object_or_404(Cities, name=config("CITY")),
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Superuser {user.username} created successfully"
                    )
                )
        except ValidationError as e:
            self.stderr.write(self.style.ERROR(f"Error: {e}"))
