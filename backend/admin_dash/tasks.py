# Import necessary modules
from celery import shared_task
from django.core.mail import EmailMultiAlternatives, BadHeaderError
from django.template.loader import render_to_string
from django.conf import settings
import logging

# Get logger instance for this module
logger = logging.getLogger(__name__)


@shared_task(bind=True)
def send_order_status_email(self, user_full_name, email, order_number, status, items):
    try:
        logger.info(
            f"Sending order status email to {email} for user {user_full_name}, order {order_number} with status {status}"
        )

        subject = f"وضعیت سفارش - {order_number}"
        to = email
        context = {
            "full_name": user_full_name,
            "order_number": order_number,
            "status": status,
            "items": items,
        }

        text_content = render_to_string("order_status.txt", context)
        html_content = render_to_string("order_status.html", context)

        email = EmailMultiAlternatives(
            subject, text_content, settings.EMAIL_HOST_USER, [to]
        )
        email.attach_alternative(html_content, "text/html")

        email.send()

        logger.info(f"Order status email sent successfully to {email}")
        return "DONE"

    except BadHeaderError as e:
        logger.error(f"BadHeaderError occurred: {e}")
        return "FAILED"

    except Exception as e:
        logger.error(f"Error sending order status email to {email}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
