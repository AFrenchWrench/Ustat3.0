from django.db import models


class BurnedTokens(models.Model):
    token = models.CharField(max_length=255, editable=False, unique=True)


class Provinces(models.Model):
    name = models.CharField(max_length=32)


class Cities(models.Model):
    province = models.ForeignKey("Provinces", on_delete=models.CASCADE)
    name = models.CharField(max_length=32)
