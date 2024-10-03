from django.contrib import admin
from .models import Order, OrderTransaction, OrderItem, DisplayItem, ItemVariant


# Registering OrderTransaction
@admin.register(OrderTransaction)
class OrderTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "order",
        "status",
        "amount",
        "creation_date",
        "due_date",
        "is_check",
    )
    search_fields = ("title", "order__order_number")
    list_filter = ("status", "is_check")
    readonly_fields = ("creation_date",)


# Registering Order
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "user",
        "creation_date",
        "due_date",
        "total_price",
        "status",
    )
    search_fields = ("order_number", "user__username")
    list_filter = ("status", "creation_date", "due_date")
    readonly_fields = ("creation_date", "order_number")


# Registering OrderItem
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "order",
        "price",
        "quantity",
        "total_price",
        "type",
        "fabric",
        "color",
        "wood_color",
    )
    search_fields = ("name", "order__order_number", "item_variant__name")
    list_filter = ("type",)


# Registering DisplayItem
@admin.register(DisplayItem)
class DisplayItemAdmin(admin.ModelAdmin):
    list_display = ("name", "type")
    search_fields = ("name",)
    list_filter = ("type",)


# Registering ItemVariant
@admin.register(ItemVariant)
class ItemVariantAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "display_item",
        "price",
        "fabric",
        "color",
        "wood_color",
        "show_in_first_page",
        "is_for_business",
    )
    search_fields = ("name", "display_item__name")
    list_filter = ("display_item__type", "show_in_first_page", "is_for_business")
