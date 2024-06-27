# Import necessary modules
from celery import shared_task
from django.core.mail import EmailMultiAlternatives, BadHeaderError
from django.template.loader import render_to_string
from django.conf import settings
import logging

# Get logger instance for this module
logger = logging.getLogger(__name__)


@shared_task(bind=True)
def send_code_email(self, user_full_name, email, code, template):
    try:
        logger.info(
            f"Sending email to {email} for user {user_full_name} with code {code}"
        )

        subject = "کد تایید"
        to = email
        context = {"full_name": user_full_name, f"{template}_code": code}

        text_content = render_to_string(f"{template}.txt", context)
        html_content = render_to_string(f"{template}.html", context)

        email = EmailMultiAlternatives(
            subject, text_content, settings.EMAIL_HOST_USER, [to]
        )
        email.attach_alternative(html_content, "text/html")

        email.send()

        logger.info(f"Email sent successfully to {email}")
        return "DONE"

    except BadHeaderError as e:
        logger.error(f"BadHeaderError occurred: {e}")
        return "FAILED"

    except Exception as e:
        logger.error(f"Error sending email to {email}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@shared_task(bind=True)
def send_otp_email(self, user_full_name, email, code):
    try:
        logger.info(
            f"Sending OTP email to {email} for user {user_full_name} with code {code}"
        )

        subject = "کد یکبار مصرف ورود"
        to = email
        context = {"full_name": user_full_name, "otp_code": code}

        text_content = render_to_string("otp.txt", context)
        html_content = render_to_string("otp.html", context)

        email = EmailMultiAlternatives(
            subject, text_content, settings.EMAIL_HOST_USER, [to]
        )
        email.attach_alternative(html_content, "text/html")

        email.send()

        logger.info(f"OTP email sent successfully to {email}")
        return "DONE"

    except BadHeaderError as e:
        logger.error(f"BadHeaderError occurred: {e}")
        return "FAILED"

    except Exception as e:
        logger.error(f"Error sending verification email to {email}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
