from django.contrib import admin
from .models import BurnedTokens, Provinces, Cities


# Registering BurnedTokens
@admin.register(BurnedTokens)
class BurnedTokensAdmin(admin.ModelAdmin):
    list_display = ("token",)
    search_fields = ("token",)
    readonly_fields = ("token",)


# Registering Provinces
@admin.register(Provinces)
class ProvincesAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


# Registering Cities
@admin.register(Cities)
class CitiesAdmin(admin.ModelAdmin):
    list_display = ("name", "province")
    search_fields = ("name", "province__name")
    list_filter = ("province",)
