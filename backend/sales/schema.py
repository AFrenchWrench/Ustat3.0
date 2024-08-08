from email import message
import re
from winsound import SND_ASYNC
from django.utils import timezone
import graphene
from django.contrib.auth import (
    get_user_model,
)
from django.shortcuts import get_object_or_404
from graphene_django import DjangoObjectType
from graphql import (
    GraphQLError,
)
from users.models import Address
from backend.utils.validation_utils import is_persian_string
from utils.schema_utils import (
    login_required,
    resolve_model_with_filters,
    staff_member_required,
)
from sales.models import (
    ItemVariant,
    Order,
    OrderItem,
    DisplayItem,
    OrderTransaction,
)
from users.schema import UserType, AddressType

User = get_user_model()


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


class CreateDisplayItemInput(graphene.InputObjectType):
    type = graphene.String(required=True)
    name = graphene.String(required=True)


class CreateItemVariantInput(graphene.InputObjectType):
    display_item = graphene.ID(required=True)
    dimensions = graphene.JSONString(required=True)
    price = graphene.BigInt(required=True)
    description = graphene.String(required=True)
    fabric = graphene.String(required=True)
    color = graphene.String(required=True)
    wood_color = graphene.String(required=True)
    show_in_first_page = graphene.Boolean(required=False)


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
            if not not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
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

            if order_item.order and hasattr(order_item.order, "transaction"):
                order_item.order.transacrtion.save()

            return CreateOrderItem(order_item=order_item, success=True)
        except Exception as e:
            print(e)
            return CreateOrderItem(success=False, errors="خطایی رخ داده است")


class CreateDisplayItem(graphene.Mutation):
    class Arguments:
        input = CreateDisplayItemInput(required=True)

    display_item = graphene.Field(DisplayItemType)
    success = graphene.Boolean()
    errors = graphene.JSONString()

    @staticmethod
    def validate_input(input):
        errors = {}

        type = input.get("type")
        if type not in DisplayItem.TYPE_CHOICES:
            errors["type"] = "نوع آیتم نمایشی نامعتبر است"

        name = input.get("name")
        if not is_persian_string(name):
            errors["name"] = "نام نمایشی باید فارسی باشد"

        return errors

    @staff_member_required
    def mutate(self, info, input):
        try:
            errors = CreateDisplayItem.validate_input(input)
            if errors:
                return CreateDisplayItem(success=False, errors=errors)

            display_item = DisplayItem.objects.create(
                **input,
            )
            return CreateDisplayItem(display_item=display_item, success=True)
        except Exception as e:
            print(e)
            return CreateDisplayItem(success=False, errors="خطایی رخ داده است")


class CreateItemVariant(graphene.Mutation):
    class Arguments:
        input = CreateItemVariantInput(required=True)

    item_variant = graphene.Field(ItemVariantType)
    success = graphene.Boolean()
    errors = graphene.JSONString()

    @staticmethod
    def validate_input(input):
        errors = {}

        display_item = input.get("display_item")
        try:
            display_item = DisplayItem.objects.get(pk=display_item)
        except DisplayItem.DoesNotExist:
            errors["display_item"] = "آیتم نمایشی یافت نشد"
            return errors

        name = input.get("name")
        if not is_persian_string(name):
            errors["name"] = "نام نمایشی باید فارسی باشد"

        dimensions = input.get("dimensions")

        if {"طول", "عرض", "ارتفاع"} not in set(dimensions.keys()):
            errors["dimensions"] = "طول، عرض و ارتفاع باید وارد شود"
        elif not all(
            isinstance(dimensions.get(key), int) and dimensions.get(key) > 0
            for key in {"طول", "عرض", "ارتفاع"}
        ):
            errors["dimensions"] = "طول، عرض و ارتفاع باید عدد طبیعی باشند"

        if display_item.type == "b" and "میز آرایش" in dimensions.keys():
            if {"طول", "عرض", "ارتفاع"} not in set(dimensions.get("میز آرایش").keys()):
                errors["dimensions"] = "طول، عرض و ارتفاع میز آرایش باید وارد شود"
            elif not all(
                isinstance(dimensions.get("میز آرایش").get(key), int)
                and dimensions.get(key) > 0
                for key in {"طول", "عرض", "ارتفاع"}
            ):
                errors["dimensions"] = (
                    "طول، عرض و ارتفاع میز آرایش باید عدد طبیعی باشند"
                )
        if display_item.type == "b" and "پا تختی" in dimensions.keys():
            if {"تعداد", "طول", "عرض", "ارتفاع"} not in set(
                dimensions.get("پا تختی").keys()
            ):
                errors["dimensions"] = "طول، عرض، ارتفاع و تعداد پا تختی باید وارد شود"
            elif not all(
                isinstance(dimensions.get("پا تختی").get(key), int)
                and dimensions.get(key) > 0
                for key in {"تعداد", "طول", "عرض", "ارتفاع"}
            ):
                errors["dimensions"] = (
                    "طول، عرض، ارتفاع و تعداد پا تختی باید عدد طبیعی باشند"
                )
        if display_item.type == "b" and "آینه" in dimensions.keys():
            if {"طول", "عرض", "ارتفاع"} not in dimensions.get("آینه").keys():
                errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"

        if display_item.type == "m":
            if "صندلی" not in dimensions.keys():
                errors["dimensions"] = " اطلاعات صندلی باید وارد شود"
            elif {"تعداد", "طول", "عرض", "ارتفاع"} not in set(
                dimensions.get("صندلی").keys()
            ):
                errors["dimensions"] = "طول، عرض، ارتفاع و تعداد صندلی باید وارد شود"
            elif not all(
                isinstance(dimensions.get("صندلی").get(key), int)
                and dimensions.get(key) > 0
                for key in {"تعداد", "طول", "عرض", "ارتفاع"}
            ):
                errors["dimensions"] = (
                    "طول، عرض، ارتفاع و تعداد صندلی باید عدد طبیعی باشند"
                )

        if display_item.type == "j":
            if "عسلی" not in dimensions.keys():
                errors["dimensions"] = " اطلاعات عسلی باید وارد شود"
            elif {"تعداد", "طول", "عرض", "ارتفاع"} not in set(
                dimensions.get("عسلی").keys()
            ):
                errors["dimensions"] = "طول، عرض، ارتفاع و تعداد عسلی باید وارد شود"
            elif not all(
                isinstance(dimensions.get("عسلی").get(key), int)
                and dimensions.get(key) > 0
                for key in {"تعداد", "طول", "عرض", "ارتفاع"}
            ):
                errors["dimensions"] = (
                    "طول، عرض، ارتفاع و تعداد عسلی باید عدد طبیعی باشند"
                )

        if display_item.type == "c":
            if "آینه" not in dimensions.keys():
                errors["dimensions"] = " اطلاعات آینه باید وارد شود"
            elif {"طول", "عرض", "ارتفاع"} not in dimensions.get("آینه").keys():
                errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"
            elif not all(
                isinstance(dimensions.get("آینه").get(key), int)
                and dimensions.get(key) > 0
                for key in {"طول", "عرض", "ارتفاع"}
            ):
                errors["dimensions"] = "طول، عرض و ارتفاع آینه باید عدد طبیعی باشند"

        price = input.get("price")
        if price < 1:
            errors["price"] = "قیمت نمایشی باید بیشتر از صفر باشد"

        description = input.get("description")
        if description:
            if not not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
                errors["description"] = (
                    "در توضیحات تنها از حروف فارسی، اعداد انگلیسی، ویرگول و یا قاصله استفاده کنید"
                )

        fabric = input.get("fabric")
        if not is_persian_string(fabric):
            errors["fabric"] = "نام پارچه باید فارسی باشد"

        color = input.get("color")
        if not is_persian_string(color):
            errors["color"] = "نام رنگ باید فارسی باشد"

        wood_color = input.get("wood_color")
        if not is_persian_string(wood_color):
            errors["wood_color"] = "نام رنگ چوب باید فارسی باشد"

        return errors

    @staff_member_required
    def mutate(self, info, input):
        try:
            errors = CreateItemVariant.validate_input(input)
            if errors:
                return CreateItemVariant(success=False, errors=errors)

            input["display_item"] = DisplayItem.objects.get(id=input["display_item"])
            item_variant = ItemVariant.objects.create(
                **input,
            )
            return CreateItemVariant(item_variant=item_variant, success=True)
        except Exception as e:
            print(e)
            return CreateItemVariant(success=False, errors="خطایی رخ داده است")


# ========================Create End========================


# ========================Update Start========================


class UpdateOrderItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    item_variant = graphene.ID(required=False)
    description = graphene.String(required=False)
    quantity = graphene.Int(required=False)


class UpdateDisplayItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    type = graphene.String(required=False)
    name = graphene.String(required=False)


class UpdateOrderInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    address = graphene.ID(required=False)
    due_date = graphene.Date(required=False)
    status = graphene.String(required=False)


class UpdateItemVariantInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=False)
    dimensions = graphene.JSONString(required=False)
    price = graphene.Float(required=False)
    description = graphene.String(required=False)
    fabric = graphene.String(required=False)
    color = graphene.String(required=False)
    wood_color = graphene.String(required=False)
    show_in_first_page = graphene.Boolean(required=False)


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
            if not not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
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
            try:
                item_variant = ItemVariant.objects.get(pk=input.get("item_variant"))
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

            if order_item.item_variant.id == item_variant.id:
                return UpdateOrderItem(
                    success=False, errors="مورد نمایشی مورد نظر یکسان است"
                )

            if order_item.item_variant.type != item_variant.type:
                return UpdateOrderItem(
                    success=False, errors="نوع محصول مورد نظر تغییر کرده است"
                )

            errors = UpdateOrderItem.validate_input(input)
            if errors:
                return UpdateOrderItem(success=False, errors=errors)

            order_item.item_variant = item_variant
            if input.get("description"):
                order_item.description = input.get("description")
            if input.get("quantity"):
                order_item.quantity = input.get("quantity")
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
            return UpdateOrderItem(success=False)


class UpdateDisplayItem(graphene.Mutation):
    class Arguments:
        input = UpdateDisplayItemInput(required=True)

    display_item = graphene.Field(DisplayItemType)
    success = graphene.Boolean()
    errors = graphene.JSONString()

    @staticmethod
    def validate_input(dispaly_item, input):
        errors = {}

        type = input.get("type")
        if type:
            if type not in DisplayItem.TYPE_CHOICES:
                errors["type"] = "نوع آیتم نمایشی نامعتبر است"
            else:
                dispaly_item.type = type

        name = input.get("name")
        if name:
            if not is_persian_string(name):
                errors["name"] = "نام نمایشی باید فارسی باشد"
            else:
                dispaly_item.name = name

        if not errors:
            dispaly_item.save()

        return dispaly_item, errors

    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                display_item = DisplayItem.objects.get(pk=input.get("id"))
            except DisplayItem.DoesNotExist:
                return UpdateDisplayItem(success=False, errors="عنوان نمایشی یافت نشد")

            display_item, errors = UpdateDisplayItem.validate_input(display_item, input)
            if errors:
                return UpdateDisplayItem(success=False, errors=errors)

            return UpdateDisplayItem(display_item=display_item, success=True)
        except Exception as e:
            print(e)
            return UpdateDisplayItem(success=False, errors="خطایی رخ داده است")


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


class UpdateItemVariant(graphene.Mutation):
    class Arguments:
        input = UpdateItemVariantInput(required=True)

    item_variant = graphene.Field(ItemVariantType)
    success = graphene.Boolean()
    errors = graphene.JSONString()

    @staticmethod
    def validate_input(item_variant, input):
        errors = {}

        display_item = item_variant.display_item

        name = input.get("name")
        if name:
            if not is_persian_string(name):
                errors["name"] = "نام نمایشی باید فارسی باشد"
            else:
                item_variant.name = name

        dimensions = input.get("dimensions")

        if dimensions:
            if {"طول", "عرض", "ارتفاع"} not in set(dimensions.keys()):
                errors["dimensions"] = "طول، عرض و ارتفاع باید وارد شود"
            elif not all(
                isinstance(dimensions.get(key), int) and dimensions.get(key) > 0
                for key in {"طول", "عرض", "ارتفاع"}
            ):
                errors["dimensions"] = "طول، عرض و ارتفاع باید عدد طبیعی باشند"

            if display_item.type == "b" and "میز آرایش" in dimensions.keys():
                if {"طول", "عرض", "ارتفاع"} not in set(
                    dimensions.get("میز آرایش").keys()
                ):
                    errors["dimensions"] = "طول، عرض و ارتفاع میز آرایش باید وارد شود"
                elif not all(
                    isinstance(dimensions.get("میز آرایش").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"طول", "عرض", "ارتفاع"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض و ارتفاع میز آرایش باید عدد طبیعی باشند"
                    )
            if display_item.type == "b" and "پا تختی" in dimensions.keys():
                if {"تعداد", "طول", "عرض", "ارتفاع"} not in set(
                    dimensions.get("پا تختی").keys()
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد پا تختی باید وارد شود"
                    )
                elif not all(
                    isinstance(dimensions.get("پا تختی").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"تعداد", "طول", "عرض", "ارتفاع"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد پا تختی باید عدد طبیعی باشند"
                    )
            if display_item.type == "b" and "آینه" in dimensions.keys():
                if {"طول", "عرض", "ارتفاع"} not in dimensions.get("آینه").keys():
                    errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"

            if display_item.type == "m":
                if "صندلی" not in dimensions.keys():
                    errors["dimensions"] = " اطلاعات صندلی باید وارد شود"
                elif {"تعداد", "طول", "عرض", "ارتفاع"} not in set(
                    dimensions.get("صندلی").keys()
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد صندلی باید وارد شود"
                    )
                elif not all(
                    isinstance(dimensions.get("صندلی").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"تعداد", "طول", "عرض", "ارتفاع"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد صندلی باید عدد طبیعی باشند"
                    )

            if display_item.type == "j":
                if "عسلی" not in dimensions.keys():
                    errors["dimensions"] = " اطلاعات عسلی باید وارد شود"
                elif {"تعداد", "طول", "عرض", "ارتفاع"} not in set(
                    dimensions.get("عسلی").keys()
                ):
                    errors["dimensions"] = "طول، عرض، ارتفاع و تعداد عسلی باید وارد شود"
                elif not all(
                    isinstance(dimensions.get("عسلی").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"تعداد", "طول", "عرض", "ارتفاع"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد عسلی باید عدد طبیعی باشند"
                    )

            if display_item.type == "c":
                if "آینه" not in dimensions.keys():
                    errors["dimensions"] = " اطلاعات آینه باید وارد شود"
                elif {"طول", "عرض", "ارتفاع"} not in dimensions.get("آینه").keys():
                    errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"
                elif not all(
                    isinstance(dimensions.get("آینه").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"طول", "عرض", "ارتفاع"}
                ):
                    errors["dimensions"] = "طول، عرض و ارتفاع آینه باید عدد طبیعی باشند"

            if not errors.get("dimensions"):
                item_variant.dimensions = dimensions

        price = input.get("price")
        if price:
            if price < 1:
                errors["price"] = "قیمت نمایشی باید بیشتر از صفر باشد"
            else:
                item_variant.price = price

        description = input.get("description")
        if description:
            if not not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
                errors["description"] = (
                    "در توضیحات تنها از حروف فارسی، اعداد انگلیسی، ویرگول و یا قاصله استفاده کنید"
                )
            else:
                item_variant.description = description

        fabric = input.get("fabric")
        if fabric:
            if not is_persian_string(fabric):
                errors["fabric"] = "نام پارچه باید فارسی باشد"
            else:
                item_variant.fabric = fabric

        color = input.get("color")
        if color:
            if not is_persian_string(color):
                errors["color"] = "نام رنگ باید فارسی باشد"
            else:
                item_variant.color = color

        wood_color = input.get("wood_color")
        if wood_color:
            if not is_persian_string(wood_color):
                errors["wood_color"] = "نام رنگ چوب باید فارسی باشد"
            else:
                item_variant.wood_color = wood_color

        if input.get("show_in_first_page"):
            item_variant.show_in_first_page = input.get("show_in_first_page")

        if not errors:
            item_variant.save()

        return item_variant, errors

    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                item_variant = ItemVariant.objects.get(pk=input.get("id"))
            except ItemVariant.DoesNotExist:
                return UpdateItemVariant(
                    success=False, errors="نوع نمایشی مورد نظر یافت نشد"
                )

            errors = UpdateItemVariant.validate_input(item_variant, input)
            if errors:
                return UpdateItemVariant(success=False, errors=errors)

            return UpdateItemVariant(success=True, item_variant=item_variant)
        except Exception as e:
            print(e)
            return UpdateItemVariant(success=False, errors="خطایی رخ داده است")


# ========================Update End========================

# ========================Delete Start========================


class DeleteOrderItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)


class DeleteOrderInput(graphene.InputObjectType):
    id = graphene.ID(required=True)


class DeleteDisplayItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)


class DeleteItemVariantInput(graphene.InputObjectType):
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


class DeleteDisplayItem(graphene.Mutation):
    class Arguments:
        input = DeleteDisplayItemInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    messages = graphene.String()

    @staff_member_required
    def mutate(self, info, input):
        try:

            try:
                display_item = DisplayItem.objects.get(pk=input.id)
            except DisplayItem.DoesNotExist:
                return DeleteDisplayItem(success=False, errors="آیتم مورد نظر پیدا نشد")

            # Delete the Order
            display_item.delete()

            return DeleteDisplayItem(
                success=True, messages="آیتم مورد نظر با موفقیت حذف شد"
            )

        except Exception as e:
            print(e)
            return DeleteDisplayItem(
                success=False, errors="خطایی رخ داده است. لطفا دوباره تلاش کنید"
            )


class DeleteItemVariant(graphene.Mutation):
    class Arguments:
        input = DeleteItemVariantInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    messages = graphene.String()

    @staff_member_required
    def mutate(self, info, input):
        try:

            try:
                item_variant = ItemVariant.objects.get(pk=input.id)
            except ItemVariant.DoesNotExist:
                return DeleteItemVariant(
                    success=False, errors="نوع آیتم مورد نظر پیدا نشد"
                )

            display_item = item_variant.display_item

            # Delete the Order
            item_variant.delete()

            if not display_item.variants.exists():
                display_item.delete()

            return DeleteItemVariant(
                success=True, messages="نوع آیتم مورد نظر با موفقیت حذف شد"
            )

        except Exception as e:
            print(e)
            return DeleteItemVariant(
                success=False, errors="خطایی رخ داده است. لطفا دوباره تلاش کنید"
            )


# ========================Delete End========================


class Mutation(graphene.ObjectType):
    create_order_item = CreateOrderItem.Field()
    create_display_item = CreateDisplayItem.Field()
    create_item_variant = CreateItemVariant.Field()
    update_order_item = UpdateOrderItem.Field()
    update_display_item = UpdateDisplayItem.Field()
    update_order = UpdateOrder.Field()
    update_item_variant = UpdateItemVariant.Field()
    delete_order_item = DeleteOrderItem.Field()
    delete_order = DeleteOrder.Field()
    delete_display_item = DeleteDisplayItem.Field()
    delete_item_variant = DeleteItemVariant.Field()


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
    title__icontains = graphene.String()
    total_price__lte = graphene.BigInt()
    total_price__gte = graphene.BigInt()
    status = graphene.List(graphene.String)
    creation_date__lte = graphene.Date()
    creation_date__gte = graphene.Date()


class ItemVariantFilterInput(graphene.InputObjectType):
    name__icontains = graphene.String()
    price__lte = graphene.BigInt()
    price__gte = graphene.BigInt()
    fabric__icontains = graphene.String()
    color = graphene.String()
    wood_color = graphene.String()


class Query(graphene.ObjectType):
    display_items = graphene.List(DisplayItemType, filter=DisplayItemFilterInput())
    display_item = graphene.Field(DisplayItemType, id=graphene.ID(required=True))
    orders = graphene.List(OrderType, filter=OrderFilterInput())
    order = graphene.Field(OrderType, id=graphene.ID(required=True))
    transactions = graphene.List(OrderTransactionType, filter=TranscationFilterInput())
    transaction = graphene.Field(OrderTransactionType, id=graphene.ID(required=True))
    item_variants = graphene.List(ItemVariantType, filter=ItemVariantFilterInput())
    item_variant = graphene.Field(ItemVariantType, id=graphene.ID(required=True))
    showcase = graphene.List(ItemVariantType)

    def resolve_display_items(self, info, filter=None):
        display_items = resolve_model_with_filters(DisplayItem, filter)
        return display_items

    def resolve_display_item(self, info, id):
        display_item = get_object_or_404(DisplayItem, pk=id)
        return display_item

    @login_required
    def resolve_orders(self, info, filter=None):
        orders = resolve_model_with_filters(Order, filter)
        return orders.filter(user=info.context.user)

    @login_required
    def resolve_order(self, info, id):
        return Order.objects.filter(user=info.context.user).get(pk=id)

    @login_required
    def resolve_transactions(self, info, filter=None):
        transactions = resolve_model_with_filters(OrderTransaction, filter)
        return transactions.filter(order__user=info.context.user)

    @login_required
    def resolve_transaction(self, info, id):
        return OrderTransaction.objects.filter(order__user=info.context.user).get(pk=id)

    def resolve_item_variants(self, info, filter=None):
        item_variants = resolve_model_with_filters(ItemVariant, filter)
        return item_variants

    def resolve_item_variant(self, info, id):
        return get_object_or_404(ItemVariant, pk=id)

    def resolve_showcase(self, info):
        showcases = {}
        for type in DisplayItem.TYPE_CHOICES:
            item_variant = ItemVariant.objects.filter(
                display_item__type=type[0], show_in_first_page=True
            ).order_by("-id")[:5]
            showcases[type] = item_variant
        return showcases


# ========================Queries End========================

schema = graphene.Schema(query=Query, mutation=Mutation)
