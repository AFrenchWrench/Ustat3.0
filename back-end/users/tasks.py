from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


@shared_task(bind=True)
def send_verification_email(self, user_full_name, email, code):
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

    return "DONE"
