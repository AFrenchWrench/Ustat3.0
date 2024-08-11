import re
from django.utils import timezone
import graphene
from django.contrib.auth import (
    get_user_model,
)
from django.shortcuts import get_object_or_404
from graphene_django import DjangoObjectType
from django.core.paginator import Paginator
from users.models import Address
from utils.schema_utils import (
    login_required,
    resolve_model_with_filters,
)
from sales.models import (
    ItemVariant,
    Order,
    OrderItem,
    DisplayItem,
    OrderTransaction,
)
from users.schema import (
    UserType,
    BusinessType,
    AddressType,
    ProvinceType,
    CityType,
)
from django.db.models import Count

User = get_user_model()

ITEM_TYPE_CHOICES = ["s", "b", "m", "j", "c"]
# ========================Mutations Start========================


# ========================Create Start========================
class OrderType(DjangoObjectType):
    class Meta:
        model = Order


class OrderItemType(DjangoObjectType):
    class Meta:
        model = OrderItem


class DisplayItemType(DjangoObjectType):
    class Meta:
        model = DisplayItem


class ItemVariantType(DjangoObjectType):
    class Meta:
        model = ItemVariant


class OrderTransactionType(DjangoObjectType):
    class Meta:
        model = OrderTransaction


class CreateOrderItemInput(graphene.InputObjectType):
    order = graphene.ID(required=False)
    item_variant = graphene.ID(required=True)
    due_date = graphene.Date(required=False)
    description = graphene.String(required=False)
    quantity = graphene.Int(required=True)


class CreateOrderItem(graphene.Mutation):
    class Arguments:
        input = CreateOrderItemInput(required=True)

    order_item = graphene.Field(OrderItemType)
    errors = graphene.JSONString()
    success = graphene.Boolean()

    @staticmethod
    def validate_input(input):
        errors = {}

        due_date = input.get("due_date")
        if due_date:
            if due_date < timezone.localdate() + timezone.timedelta(days=15):
                errors["due_date"] = "تاریخ تحویل باید دیرتر از 15 روز آینده باشد"

        description = input.get("description")
        if description:
            if not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
                errors["description"] = (
                    "در توضیحات تنها از حروف فارسی، اعداد انگلیسی، ویرگول و یا قاصله استفاده کنید"
                )

        quantity = input.get("quantity")
        if quantity:
            if quantity < 1:
                errors["quantity"] = "تعداد باید بزرگتر از صفر باشد"

        return errors

    @login_required
    def mutate(self, info, input):
        try:
            errors = CreateOrderItem.validate_input(input)
            if errors:
                return CreateOrderItem(success=False, errors=errors)

            order = input.get("order")
            if order:
                try:
                    order = Order.objects.get(pk=order)
                except Order.DoesNotExist:
                    return CreateOrderItem(
                        success=False, errors="سفارش مورد نظر یافت نشد"
                    )
            else:
                order = Order.objects.create(
                    user=info.context.user, due_date=input.get("due_date")
                )

            try:
                item_variant = ItemVariant.objects.get(pk=input.get("item_variant"))
            except DisplayItem.DoesNotExist:
                return CreateOrderItem(
                    success=False, errors="عنوان نمایشی مورد نظر یافت نشد"
                )

            order_item, created = OrderItem.objects.get_or_create(
                order=order,
                item_variant=item_variant,
                name=item_variant.name,
                dimensions=item_variant.dimensions,
                fabric=item_variant.fabric,
                color=item_variant.color,
                wood_color=item_variant.wood_color,
                defaults={
                    "type": item_variant.display_item.type,
                    "price": item_variant.price,
                    "thumbnail": item_variant.thumbnail,
                    "description": input.get("description"),
                },
            )

            if not created:
                # If the item was retrieved, update its quantity
                order_item.quantity += input.get("quantity", 1)
            else:
                order_item.quantity = input.get("quantity", 1)

            order_item.save()
            order_item.order.save()

            return CreateOrderItem(order_item=order_item, success=True)
        except Exception as e:
            print(e)
            return CreateOrderItem(success=False, errors="خطایی رخ داده است")


# ========================Create End========================


# ========================Update Start========================


class UpdateOrderItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    item_variant = graphene.ID(required=False)
    description = graphene.String(required=False)
    quantity = graphene.Int(required=False)


class UpdateOrderInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    address = graphene.ID(required=False)
    due_date = graphene.Date(required=False)
    status = graphene.String(required=False)


class UpdateOrderItem(graphene.Mutation):
    class Arguments:
        input = UpdateOrderItemInput(required=True)

    order_item = graphene.Field(OrderItemType)
    errors = graphene.JSONString()
    success = graphene.Boolean()

    @staticmethod
    def validate_input(input):
        errors = {}

        description = input.get("description")
        if description:
            if not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
                errors["description"] = (
                    "در توضیحات تنها از حروف فارسی، اعداد انگلیسی، ویرگول و یا قاصله استفاده کنید"
                )

        quantity = input.get("quantity")
        if quantity:
            if quantity < 1:
                errors["quantity"] = "تعداد باید بزرگتر از صفر باشد"

        return errors

    @login_required
    def mutate(self, info, input):
        try:
            item_variant = input.get("item_variant")
            if item_variant:
                try:
                    item_variant = ItemVariant.objects.get(pk=item_variant)
                except ItemVariant.DoesNotExist:
                    return UpdateOrderItem(
                        success=False, errors="مورد نمایشی مورد نظر یافت نشد"
                    )

            try:
                order_item = OrderItem.objects.get(pk=input.get("id"))
            except OrderItem.DoesNotExist:
                return UpdateOrderItem(success=False, errors="محصول مورد نظر یافت نشد")

            if order_item.order.user != info.context.user:
                return UpdateOrderItem(
                    success=False, errors="شما دسترسی ویرایش این محصول را ندارید"
                )

            if order_item.order.status != "ps":
                return UpdateOrderItem(
                    success=False, errors="سفارش مورد نظر در حال پردازش است"
                )

            if item_variant and order_item.item_variant.id == item_variant.id:
                return UpdateOrderItem(
                    success=False, errors="مورد نمایشی مورد نظر یکسان است"
                )

            if (
                item_variant
                and order_item.item_variant.display_item.type
                != item_variant.display_item.type
            ):
                return UpdateOrderItem(
                    success=False, errors="نوع محصول مورد نظر تغییر کرده است"
                )

            errors = UpdateOrderItem.validate_input(input)
            if errors:
                return UpdateOrderItem(success=False, errors=errors)

            if input.get("description"):
                order_item.description = input.get("description")
            if input.get("quantity"):
                order_item.quantity = input.get("quantity")

            if item_variant:
                order_item.item_variant = item_variant
                order_item.name = item_variant.name
                order_item.dimensions = item_variant.dimensions
                order_item.price = item_variant.price
                order_item.fabric = item_variant.fabric
                order_item.color = item_variant.color
                order_item.wood_color = item_variant.wood_color
                order_item.thumbnail = item_variant.thumbnail

            order_item.save()
            return UpdateOrderItem(order_item=order_item, success=True)
        except Exception as e:
            print(e)
            return UpdateOrderItem(success=False, errors="خطایی رخ داده است")


class UpdateOrder(graphene.Mutation):
    class Arguments:
        input = UpdateOrderInput(required=True)

    order = graphene.Field(OrderType)
    success = graphene.Boolean()
    errors = graphene.JSONString()

    @staticmethod
    def validate_input(user, order, input):
        errors = {}

        due_date = input.get("due_date")
        if due_date:
            if due_date < timezone.localdate() + timezone.timedelta(days=15):
                errors["due_date"] = "تاریخ تحویل باید دیرتر از 15 روز آینده باشد"
            else:
                order.due_date = due_date

        status = input.get("status")
        if status:
            if status not in ("p", "c"):
                errors["status"] = "وضعیت سفارش نامعتبر است"
            else:
                order.status = status

        address = input.get("address")

        if status == "p" and not address:
            errors["address"] = "آدرس نمی تواند خالی باشد"
        elif address:
            try:
                address = Address.objects.get(pk=address)
                if address.user != user:
                    errors["address"] = "شما دسترسی این آدرس را ندارید"
                else:
                    order.address = address
            except Address.DoesNotExist:
                errors["address"] = "آدرس انتخاب شده یافت نشد"

        if not errors:
            order.save()

        return order, errors

    @login_required
    def mutate(self, info, input):
        try:
            try:
                order = Order.objects.get(pk=input.get("id"))
            except Order.DoesNotExist:
                return UpdateOrder(success=False, errors="سفارش مورد نظر یافت نشد")

            if order.user != info.context.user:
                return UpdateOrderItem(
                    success=False, errors="شما دسترسی ویرایش این محصول را ندارید"
                )

            if order.status != "ps":
                return UpdateOrderItem(
                    success=False, errors="سفارش مورد نظر در حال پردازش است"
                )

            order, errors = UpdateOrder.validate_input(info.context.user, order, input)

            if errors:
                return UpdateOrder(success=False, errors=errors)

            return UpdateOrder(order=order, success=True)
        except Exception as e:
            print(e)
            return UpdateOrder(success=False, errors="خطایی رخ داده است")


# ========================Update End========================

# ========================Delete Start========================


class DeleteOrderItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)


class DeleteOrderInput(graphene.InputObjectType):
    id = graphene.ID(required=True)


class DeleteOrderItem(graphene.Mutation):
    class Arguments:
        input = DeleteOrderItemInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    messages = graphene.String()

    @login_required
    def mutate(self, info, input):
        try:
            user = info.context.user

            try:
                order_item = OrderItem.objects.get(pk=input.id)
            except OrderItem.DoesNotExist:
                return DeleteOrderItem(success=False, errors="محصول مورد نظر یافت نشد")

            order = order_item.order
            if order.user != user or order.status != "ps":
                return DeleteOrderItem(
                    success=False, errors="شما دسترسی حذف این محصول را ندارید"
                )

            # Delete the OrderItem
            order_item.delete()

            # Check if the Order has any remaining items
            if not order.items.exists():
                # Delete the Order
                order.delete()

            return DeleteOrderItem(
                success=True, messages="محصول مورد نظر با موفقیت حذف شد"
            )
        except Exception as e:
            print(e)
            return DeleteOrderItem(
                success=False, errors="خطایی رخ داده است. لطفا دوباره تلاش کنید"
            )


class DeleteOrder(graphene.Mutation):
    class Arguments:
        input = DeleteOrderInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    messages = graphene.String()

    @login_required
    def mutate(self, info, input):
        try:
            user = info.context.user

            try:
                order = Order.objects.get(pk=input.id)
            except Order.DoesNotExist:
                return DeleteOrder(success=False, errors="سفارش مورد نظر پیدا نشد")

            if order.user != user and order.status != "ps":
                return DeleteOrder(
                    success=False,
                    errors="شما دسترسی حذف این سفارش را ندارید",
                )

            # Delete the Order
            order.delete()

            return DeleteOrder(success=True, messages="سفارش مورد نظر با موفقیت حذف شد")

        except Exception as e:
            print(e)
            return DeleteOrder(
                success=False, errors="خطایی رخ داده است. لطفا دوباره تلاش کنید"
            )


# ========================Delete End========================


class Mutation(graphene.ObjectType):
    create_order_item = CreateOrderItem.Field()
    update_order_item = UpdateOrderItem.Field()
    update_order = UpdateOrder.Field()
    delete_order_item = DeleteOrderItem.Field()
    delete_order = DeleteOrder.Field()


# ========================Mutations End========================


# ========================Queries Start========================
class DisplayItemFilterInput(graphene.InputObjectType):
    type = graphene.List(graphene.String)
    name__icontains = graphene.String()


class OrderFilterInput(graphene.InputObjectType):
    status = graphene.List(graphene.String)
    due_date__gte = graphene.Date()
    due_date__lte = graphene.Date()
    order_number__icontains = graphene.String()
    creation_date__lte = graphene.Date()
    creation_date__gte = graphene.Date()
    address__title__icontains = graphene.String()


class TranscationFilterInput(graphene.InputObjectType):
    order__id = graphene.ID()
    title__icontains = graphene.String()
    total_price__lte = graphene.BigInt()
    total_price__gte = graphene.BigInt()
    status = graphene.List(graphene.String)
    creation_date__lte = graphene.Date()
    creation_date__gte = graphene.Date()


class ItemVariantFilterInput(graphene.InputObjectType):
    display_item__id = graphene.ID()
    name__icontains = graphene.String()
    price__lte = graphene.BigInt()
    price__gte = graphene.BigInt()
    fabric__icontains = graphene.String()
    color = graphene.String()
    wood_color = graphene.String()
    is_for_business = graphene.Boolean()


class PaginatedDisplayItem(graphene.ObjectType):
    items = graphene.List(DisplayItemType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class PaginatedOrder(graphene.ObjectType):
    items = graphene.List(OrderType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class PaginatedTransaction(graphene.ObjectType):
    items = graphene.List(OrderTransactionType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class Query(graphene.ObjectType):
    display_items = graphene.Field(
        PaginatedDisplayItem,
        page=graphene.Int(),
        per_page=graphene.Int(),
        filter=DisplayItemFilterInput(),
    )
    display_item = graphene.Field(DisplayItemType, id=graphene.ID(required=True))
    orders = graphene.Field(
        PaginatedOrder,
        page=graphene.Int(),
        per_page=graphene.Int(),
        filter=OrderFilterInput(),
    )
    order = graphene.Field(OrderType, id=graphene.ID(required=True))
    transactions = graphene.Field(
        PaginatedTransaction,
        page=graphene.Int(),
        per_page=graphene.Int(),
        filter=TranscationFilterInput(),
    )
    transaction = graphene.Field(OrderTransactionType, id=graphene.ID(required=True))
    item_variants = graphene.List(ItemVariantType, filter=ItemVariantFilterInput())
    item_variant = graphene.Field(ItemVariantType, id=graphene.ID(required=True))
    showcase = graphene.List(ItemVariantType)

    def resolve_display_items(self, info, page=1, per_page=12, filter=None):
        display_items = resolve_model_with_filters(DisplayItem, filter)
        display_items = display_items.annotate(variants_count=Count("variants")).filter(
            variants_count__gte=1
        )
        paginator = Paginator(display_items, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedDisplayItem(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )

    def resolve_display_item(self, info, id):
        display_item = get_object_or_404(DisplayItem, pk=id)
        return display_item

    @login_required
    def resolve_orders(self, info, page=1, per_page=10, filter=None):
        orders = resolve_model_with_filters(Order, filter)
        orders.filter(user=info.context.user)
        paginator = Paginator(orders, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedOrder(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )

    @login_required
    def resolve_order(self, info, id):
        return get_object_or_404(Order, pk=id, user=info.context.user)

    @login_required
    def resolve_transactions(self, info, page=1, per_page=10, filter=None):
        transactions = resolve_model_with_filters(OrderTransaction, filter)
        transactions.filter(order__user=info.context.user)
        paginator = Paginator(transactions, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedTransaction(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )

    @login_required
    def resolve_transaction(self, info, id):
        return get_object_or_404(OrderTransaction, pk=id, order__user=info.context.user)

    def resolve_item_variants(self, info, filter=None):
        item_variants = resolve_model_with_filters(ItemVariant, filter)
        return item_variants

    def resolve_item_variant(self, info, id):
        return get_object_or_404(ItemVariant, pk=id)

    def resolve_showcase(self, info):
        showcases = []
        for type in ITEM_TYPE_CHOICES:
            item_variant = ItemVariant.objects.filter(
                display_item__type=type[0], show_in_first_page=True
            ).order_by("-id")[:5]
            for item in item_variant:
                showcases.append(item)
        return showcases


# ========================Queries End========================

schema = graphene.Schema(query=Query, mutation=Mutation)
