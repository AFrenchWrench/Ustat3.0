from datetime import timedelta
from itertools import count
from typing import Required
from django.db import models
from django.utils import timezone
from image_optimizer.fields import OptimizedImageField


ITEM_TYPE_CHOICES = [
    ("s", "مبل"),
    ("b", "سرویس خواب"),
    ("m", "میز و صندلی"),
    ("j", "جلومبلی و عسلی"),
    ("c", "آینه کنسول"),
]


class Order(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    price = models.PositiveBigIntegerField()
    requested_date = models.DateField(blank=True)
    creation_date = models.DateField(auto_now_add=True)
    order_number = models.CharField(max_length=15, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()

        if not self.pk and not self.requested_date:
            self.requested_date = timezone.now() + timezone.timedelta(days=25)

        super().save(*args, **kwargs)

    def generate_order_number(self):
        date_str = (timezone.now().strftime("%y%m%d"))[1:3]
        order_no = (
            count(Order.objects.filter(order_number__icontains=f"UST{date_str}")) + 1
        )
        return f"UST{date_str}-{order_no:06d}"

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey("Order", on_delete=models.CASCADE)
    type = models.CharField(max_length=1, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=32)
    dimensions = models.JSONField()
    price = models.PositiveBigIntegerField()
    description = models.TextField(null=True, blank=True)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return self.name


class FabricReceipt(models.Model):
    driver = models.ForeignKey("users.Driver", on_delete=models.CASCADE)
    item = models.ForeignKey("OrderItem", on_delete=models.CASCADE)
    name = models.CharField(max_length=32)
    code = models.CharField(max_length=32)
    size = models.FloatField()
    unit = models.FloatField()
    total_size = models.FloatField()
    fabric_image = OptimizedImageField(upload_to="fabrics/")
    price = models.PositiveBigIntegerField()

    def __str__(self):
        return self.name


class DisplayItem(models.Model):
    type = models.CharField(max_length=16, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=32, unique=True)
    dimensions = models.JSONField()
    images = models.JSONField()
    price = models.PositiveBigIntegerField()
    description = models.TextField()

    def __str__(self):
        return self.name