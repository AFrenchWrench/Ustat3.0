from celery import shared_task

@shared_task(bind=True)
def send_verification_email(self):
    for i in range(10):
        print(i)

    return "DONE"