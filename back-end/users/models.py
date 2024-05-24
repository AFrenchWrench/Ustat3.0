from django.db import models
from django.contrib.auth.models import AbstractUser
from image_optimizer.fields import OptimizedImageField
from django.core.validators import (
    EmailValidator,
)


class User(AbstractUser):
    username = models.CharField(max_length=32, unique=True)
    first_name = models.CharField(max_length=32)
    last_name = models.CharField(max_length=32)
    phone_number = models.CharField(max_length=13, unique=True)
    landline_number = models.CharField(max_length=13, unique=True)
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator(message="ایمیل وارد شده معتبر نمی‌باشد")],
    )
    profile_image = OptimizedImageField(upload_to="profiles/", null=True, blank=True)
    city = models.ForeignKey("main.cities", on_delete=models.SET_NULL, null=True)
    is_staff = models.BooleanField(default=False)
    position = models.CharField(max_length=32, null=True, blank=True)
    date_joined = models.DateField(auto_now_add=True)
    birth_date = models.DateField()

    def __str__(self):
        return self.username


class Business(models.Model):
    user = models.OneToOneField("User", on_delete=models.CASCADE)
    name = models.CharField(max_length=32, unique=True)
    owner_first_name = models.CharField(max_length=32)
    owner_last_name = models.CharField(max_length=32)
    owner_phone_number = models.CharField(max_length=13, unique=True)
    address = models.TextField()
    is_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Driver(models.Model):
    first_name = models.CharField(max_length=32)
    last_name = models.CharField(max_length=32)
    phone_number = models.CharField(max_length=13, unique=True)
    national_code = models.CharField(max_length=10, unique=True)
    plate_number = models.CharField(max_length=8, unique=True)
    car_model = models.CharField(max_length=16)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
