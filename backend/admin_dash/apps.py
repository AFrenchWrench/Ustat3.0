from django.apps import AppConfig


class AdminDashConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "admin_dash"

    def ready(self):
        import admin_dash.signals
