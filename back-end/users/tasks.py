# Import necessary modules
from celery import shared_task
from django.core.mail import EmailMultiAlternatives, BadHeaderError
from django.template.loader import render_to_string
from django.conf import settings
import logging

# Get logger instance for this module
logger = logging.getLogger(__name__)


@shared_task(bind=True)
def send_verification_email(self, user_full_name, email, code):
    try:
        logger.info(f"Sending verification email to {email} for user {user_full_name} with code {code}")

        subject = "تایید ایمیل"
        to = email
        context = {"full_name": user_full_name, "verification_code": code}

        text_content = render_to_string("email.txt", context)
        html_content = render_to_string("email.html", context)

        email = EmailMultiAlternatives(
            subject, text_content, settings.EMAIL_HOST_USER, [to]
        )
        email.attach_alternative(html_content, "text/html")

        email.send()

        logger.info(f"Verification email sent successfully to {email}")
        return "DONE"

    except BadHeaderError as e:
        logger.error(f"BadHeaderError occurred: {e}")
        return "FAILED"

    except Exception as e:
        logger.error(f"Error sending verification email to {email}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
