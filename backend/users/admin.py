from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Business, Address


# Customizing the User admin interface
class CustomUserAdmin(UserAdmin):
    # Fields to display in the admin list view
    list_display = (
        "username",
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "landline_number",
        "is_fully_authenticated",
    )
    # Fields to search in the admin interface
    search_fields = ("username", "email", "phone_number")
    # Fieldsets to group form fields in the admin detail view
    fieldsets = UserAdmin.fieldsets + (
        (
            None,
            {
                "fields": (
                    "phone_number",
                    "landline_number",
                    "position",
                    "birthdate",
                    "is_fully_authenticated",
                )
            },
        ),
    )
    # Fields that are read-only
    readonly_fields = ("email",)


# Register the User model with the customized admin class
admin.site.register(User, CustomUserAdmin)


# Registering the Business model
@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner_first_name",
        "owner_last_name",
        "owner_phone_number",
        "is_confirmed",
        "rank",
    )
    search_fields = (
        "name",
        "owner_first_name",
        "owner_last_name",
        "owner_phone_number",
    )
    list_filter = ("is_confirmed", "rank")


# Registering the Address model
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("title", "province", "city", "address", "postal_code")
    search_fields = ("title", "address", "postal_code")
    list_filter = ("province", "city")
