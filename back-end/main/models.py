from django.db import models


class BurnedTokens(models.Model):
    token = models.CharField(max_length=255, editable=False, unique=True)
