from itertools import count
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


class OrderTransaction(models.Model):
    order = models.OneToOneField(
        "Order", on_delete=models.CASCADE, related_name="transaction"
    )
    price = models.PositiveBigIntegerField()
    status = models.CharField(
        max_length=1,
        choices=[
            ("p", "در انتظار پرداخت"),
            ("c", "لغو شده"),
            ("d", "پرداخت شده"),
        ],
        default="p",
    )
    creation_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(blank=True)

    def save(self, *args, **kwargs):
        self.price = self.get_total_price()

        if not self.pk and not self.due_date:
            self.due_date = timezone.now() + timezone.timedelta(days=25)

        super().save(*args, **kwargs)

    def get_total_price(self):
        total_price = sum(item.price * item.quantity for item in self.order.items.all())
        return total_price


class Order(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    due_date = models.DateField(blank=True)
    creation_date = models.DateField(auto_now_add=True)
    order_number = models.CharField(max_length=17, unique=True, blank=True)
    status = models.CharField(
        max_length=2,
        choices=[
            ("p", "در انتظار تایید"),
            ("ps", "در انتظار ثبت"),
            ("d", "تایید نشده"),
            ("a", "تایید شده"),
            ("c", "لغو شده"),
        ],
        default="ps",
    )

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()

        if not self.pk and not self.due_date:
            self.due_date = timezone.now() + timezone.timedelta(days=25)

        if self.status == "a" and not hasattr(self, "transaction"):
            transaction = OrderTransaction.objects.create(order=self)
        elif self.status == "c" and hasattr(self, "transaction"):
            transaction = self.transaction
            transaction.status = "c"
            transaction.save()

        super().save(*args, **kwargs)

    def generate_order_number(self):
        year = (timezone.now().strftime("%Y%M%D"))[0:4]
        month = (timezone.now().strftime("%Y%m%D"))[4:6]

        order_no = (
            Order.objects.filter(order_number__icontains=f"UST{year}").last().id + 1
        )
        return f"UST{year}-{month}{order_no:06d}"

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey("Order", on_delete=models.CASCADE, related_name="items")
    type = models.CharField(max_length=1, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=32)
    dimensions = models.JSONField()
    price = models.PositiveBigIntegerField()
    description = models.TextField(null=True, blank=True)
    quantity = models.PositiveIntegerField()

    def save(self, *args, **kwargs):

        if self.order and hasattr(self.order, "transaction"):
            self.order.transacrtion.save()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DisplayItem(models.Model):
    type = models.CharField(max_length=1, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=32, unique=True)
    dimensions = models.JSONField()
    price = models.PositiveBigIntegerField()
    description = models.TextField()

    thumbnail = OptimizedImageField(
        upload_to="display_items/thumbnails/",
        blank=True,
        null=True,
        optimized_image_output_size=(500, 500),
        optimized_image_resize_method="cover",
    )
    slider1 = OptimizedImageField(
        upload_to="display_items/sliders/",
        blank=True,
        null=True,
        optimized_image_output_size=(1200, 600),
        optimized_image_resize_method="cover",
    )
    slider2 = OptimizedImageField(
        upload_to="display_items/sliders/",
        blank=True,
        null=True,
        optimized_image_output_size=(1200, 600),
        optimized_image_resize_method="cover",
    )
    slider3 = OptimizedImageField(
        upload_to="display_items/sliders/",
        blank=True,
        null=True,
        optimized_image_output_size=(1200, 600),
        optimized_image_resize_method="cover",
    )

    def __str__(self):
        return self.name
