from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from sales.models import Order
from admin_dash.tasks import send_order_status_email


@receiver(pre_save, sender=Order)
def save_old_status(sender, instance, **kwargs):
    """
    Store the old status before the instance is saved.
    """
    if instance.pk:
        # Get the old status from the database
        instance._old_status = Order.objects.get(pk=instance.pk).status
    else:
        instance._old_status = None


@receiver(post_save, sender=Order)
def order_status_updated(sender, instance, **kwargs):
    """
    Trigger an email if the status field has been updated.
    """
    if not kwargs.get("created", False) and instance._old_status != instance.status:
        user_full_name = instance.user.get_full_name()
        email = instance.user.email
        order_number = instance.order_number
        status = instance.get_status_display()
        items = instance.items.values_list(
            "name", flat=True
        )  # Assuming you have a related name for items

        # Call the task
        send_order_status_email.delay(
            user_full_name, email, order_number, status, list(items)
        )
