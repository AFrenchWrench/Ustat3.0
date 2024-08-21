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
    title = models.CharField(max_length=128)
    order = models.ForeignKey(
        "Order", on_delete=models.CASCADE, related_name="transactions"
    )
    status = models.CharField(
        max_length=2,
        choices=[
            ("a", "تایید شده"),
            ("d", "تایید نشده"),
            ("p", "در انتظار پرداخت"),
            ("c", "لغو شده"),
            ("pd", "پرداخت شده"),
        ],
        default="p",
    )
    amount = models.PositiveBigIntegerField()
    creation_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(blank=True)
    is_check = models.BooleanField(default=False)
    proof = OptimizedImageField(
        upload_to="proofs",
        blank=True,
        null=True,
        optimized_image_output_size=(1000, 1000),
        optimized_image_resize_method="cover",
    )
    description = models.TextField(null=True,blank=True)

    def save(self, *args, **kwargs):

        if not self.pk and not self.due_date:
            self.due_date = timezone.localdate() + timezone.timedelta(days=7)

        super().save(*args, **kwargs)


class Order(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    due_date = models.DateField(blank=True)
    creation_date = models.DateField(auto_now_add=True)
    order_number = models.CharField(max_length=17, unique=True, blank=True)
    total_price = models.PositiveBigIntegerField(default=0)
    address = models.ForeignKey(
        "users.Address", on_delete=models.PROTECT, null=True, blank=True
    )
    status = models.CharField(
        max_length=3,
        choices=[
            ("ps", "در انتظار ثبت"),
            ("p", "در انتظار تایید"),
            ("a", "تایید شده"),
            ("pp", "در انتظار پرداخت"),
            ("pd", "پرداخت شده"),
            ("pse", "در انتظار ارسال"),
            ("s", "ارسال شده"),
            ("de", "تحویل داده شده"),
            ("d", "تایید نشده"),
            ("c", "لغو شده"),
        ],
        default="ps",
    )

    def save(self, *args, **kwargs):

        if self.pk:
            self.total_price = self.get_total_price()

        if not self.order_number:
            self.order_number = self.generate_order_number()

        if not self.pk and not self.due_date:
            self.due_date = timezone.localdate() + timezone.timedelta(days=25)

        if self.status == "c" and OrderTransaction.objects.filter(order=self).exists():
            transactions = self.transactions
            for transaction in transactions:
                transaction.status = "c"
                transaction.save()
        super().save(*args, **kwargs)

    def generate_order_number(self):
        year = (timezone.now().strftime("%Y%M%D"))[0:4]
        month = (timezone.now().strftime("%Y%m%D"))[4:6]
        last_oder = Order.objects.filter(order_number__icontains=f"UST{year}").last()
        order_no = (last_oder.id + 1) if last_oder is not None else 1
        return f"UST{year}-{month}{order_no:06d}"

    def get_total_price(self):
        total_price = sum(item.total_price for item in self.items.all())
        return total_price

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    total_price = models.PositiveBigIntegerField()
    order = models.ForeignKey("Order", on_delete=models.CASCADE, related_name="items")
    item_variant = models.ForeignKey(
        "ItemVariant", on_delete=models.PROTECT, related_name="order_items"
    )
    type = models.CharField(max_length=1, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=64)
    dimensions = models.JSONField()
    price = models.PositiveBigIntegerField()
    description = models.TextField(null=True, blank=True)
    fabric = models.CharField(max_length=32, null=True, blank=True)
    color = models.CharField(max_length=32)
    wood_color = models.CharField(max_length=32)
    quantity = models.PositiveIntegerField(default=1)
    thumbnail = OptimizedImageField(
        upload_to="order_items/thumbnails/",
        blank=True,
        null=True,
        optimized_image_output_size=(500, 500),
        optimized_image_resize_method="cover",
    )

    def save(self, *args, **kwargs):
        self.total_price = self.price * self.quantity

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DisplayItem(models.Model):
    type = models.CharField(max_length=1, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.name


class ItemVariant(models.Model):
    display_item = models.ForeignKey(
        DisplayItem, on_delete=models.CASCADE, related_name="variants"
    )
    name = models.CharField(max_length=64, unique=True)
    dimensions = models.JSONField()
    price = models.PositiveBigIntegerField()
    description = models.TextField()
    fabric = models.CharField(max_length=32)
    color = models.CharField(max_length=32)
    wood_color = models.CharField(max_length=32)
    show_in_first_page = models.BooleanField(default=False)
    is_for_business = models.BooleanField(default=False)

    thumbnail = OptimizedImageField(
        upload_to="display_items_variant/thumbnails/",
        blank=True,
        null=True,
        optimized_image_output_size=(500, 500),
        optimized_image_resize_method="cover",
    )
    slider1 = OptimizedImageField(
        upload_to="display_items_variant/sliders/",
        blank=True,
        null=True,
        optimized_image_output_size=(1200, 600),
        optimized_image_resize_method="cover",
    )
    slider2 = OptimizedImageField(
        upload_to="display_items_variant/sliders/",
        blank=True,
        null=True,
        optimized_image_output_size=(1200, 600),
        optimized_image_resize_method="cover",
    )
    slider3 = OptimizedImageField(
        upload_to="display_items_variant/sliders/",
        blank=True,
        null=True,
        optimized_image_output_size=(1200, 600),
        optimized_image_resize_method="cover",
    )
