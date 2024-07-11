from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser
from image_optimizer.fields import OptimizedImageField
from django.core.validators import (
    EmailValidator,
)


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(username, email, password, **extra_fields)


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
    city = models.ForeignKey("main.cities", on_delete=models.SET_NULL, null=True)
    position = models.CharField(max_length=32, null=True, blank=True)
    birthdate = models.DateField()
    is_fully_authenticated = models.BooleanField(default=False)

    objects = UserManager()

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
