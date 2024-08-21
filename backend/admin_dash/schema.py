import re
from django.utils import timezone
import graphene
from django.contrib.auth import (
    get_user_model,
)
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from users.models import Address
from utils.validation_utils import is_persian_string
from utils.schema_utils import (
    resolve_model_with_filters,
    staff_member_required,
)
from users.models import Business
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
from sales.schema import (
    OrderType,
    AddressType,
    DisplayItemType,
    ItemVariantType,
    OrderTransactionType,
    OrderItemType,
    ITEM_TYPE_CHOICES,
)

User = get_user_model()

# ========================Mutations Start========================


# ========================Create Start========================


class CreateDisplayItemInput(graphene.InputObjectType):
    type = graphene.String(required=True)
    name = graphene.String(required=True)


class CreateItemVariantInput(graphene.InputObjectType):
    display_item = graphene.ID(required=True)
    name = graphene.String(required=True)
    dimensions = graphene.JSONString(required=True)
    price = graphene.BigInt(required=True)
    description = graphene.String(required=True)
    fabric = graphene.String(required=True)
    color = graphene.String(required=True)
    wood_color = graphene.String(required=True)
    show_in_first_page = graphene.Boolean(required=False)
    is_for_business = graphene.Boolean(required=False)


class CreateTransactionInput(graphene.InputObjectType):
    title = graphene.String(required=True)
    order = graphene.ID(required=True)
    amount = graphene.BigInt(required=True)
    due_date = graphene.Date(required=False)
    description = graphene.String(required=False)


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
        if type not in ITEM_TYPE_CHOICES:
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

        if {"length", "width", "height"} != set(dimensions.keys()):
            errors["dimensions"] = "طول، عرض و ارتفاع باید وارد شود"
        elif not all(
            isinstance(dimensions.get(key), int) and dimensions.get(key) > 0
            for key in {"length", "width", "height"}
        ):
            errors["dimensions"] = "طول، عرض و ارتفاع باید عدد طبیعی باشند"

        if display_item.type == "b" and "makeup table" in dimensions.keys():
            if {"length", "width", "height"} != set(
                dimensions.get("makeup table").keys()
            ):
                errors["dimensions"] = "طول، عرض و ارتفاع میز آرایش باید وارد شود"
            elif not all(
                isinstance(dimensions.get("makeup table").get(key), int)
                and dimensions.get(key) > 0
                for key in {"length", "width", "height"}
            ):
                errors["dimensions"] = (
                    "طول، عرض و ارتفاع میز آرایش باید عدد طبیعی باشند"
                )
        if display_item.type == "b" and "night stand" in dimensions.keys():
            if {"quantity", "length", "width", "height"} != set(
                dimensions.get("night stand").keys()
            ):
                errors["dimensions"] = "طول، عرض، ارتفاع و تعداد پا تختی باید وارد شود"
            elif not all(
                isinstance(dimensions.get("night stand").get(key), int)
                and dimensions.get(key) > 0
                for key in {"quantity", "length", "width", "height"}
            ):
                errors["dimensions"] = (
                    "طول، عرض، ارتفاع و تعداد پا تختی باید عدد طبیعی باشند"
                )
        if display_item.type == "b" and "mirror" in dimensions.keys():
            if {"length", "width", "height"} not in dimensions.get("mirror").keys():
                errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"

        if display_item.type == "m":
            if "chair" not in dimensions.keys():
                errors["dimensions"] = " اطلاعات صندلی باید وارد شود"
            elif {"quantity", "length", "width", "height"} != set(
                dimensions.get("chair").keys()
            ):
                errors["dimensions"] = "طول، عرض، ارتفاع و تعداد صندلی باید وارد شود"
            elif not all(
                isinstance(dimensions.get("chair").get(key), int)
                and dimensions.get(key) > 0
                for key in {"quantity", "length", "width", "height"}
            ):
                errors["dimensions"] = (
                    "طول، عرض، ارتفاع و تعداد صندلی باید عدد طبیعی باشند"
                )

        if display_item.type == "j":
            if "side table" not in dimensions.keys():
                errors["dimensions"] = " اطلاعات عسلی باید وارد شود"
            elif {"quantity", "length", "width", "height"} != set(
                dimensions.get("side table").keys()
            ):
                errors["dimensions"] = "طول، عرض، ارتفاع و تعداد عسلی باید وارد شود"
            elif not all(
                isinstance(dimensions.get("side table").get(key), int)
                and dimensions.get(key) > 0
                for key in {"quantity", "length", "width", "height"}
            ):
                errors["dimensions"] = (
                    "طول، عرض، ارتفاع و تعداد عسلی باید عدد طبیعی باشند"
                )

        if display_item.type == "c":
            if "mirror" not in dimensions.keys():
                errors["dimensions"] = " اطلاعات آینه باید وارد شود"
            elif {"length", "width", "height"} not in dimensions.get("mirror").keys():
                errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"
            elif not all(
                isinstance(dimensions.get("mirror").get(key), int)
                and dimensions.get(key) > 0
                for key in {"length", "width", "height"}
            ):
                errors["dimensions"] = "طول، عرض و ارتفاع آینه باید عدد طبیعی باشند"

        price = input.get("price")
        if price < 1:
            errors["price"] = "قیمت نمایشی باید بیشتر از صفر باشد"

        description = input.get("description")
        if description:
            if not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
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


class CreateTransaction(graphene.Mutation):
    class Arguments:
        input = CreateTransactionInput(required=True)

    transaction = graphene.Field(OrderTransactionType)
    errors = graphene.String()
    success = graphene.Boolean()

    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                input["order"] = Order.objects.get(id=input["order"])
            except Order.DoesNotExist:
                return CreateTransaction(success=False, errors="سفارش یافت نشد")

            transaction = OrderTransaction.objects.create(
                **input,
            )
            return CreateTransaction(transaction=transaction, success=True)
        except Exception as e:
            print(e)
            return CreateTransaction(success=False, errors="خطایی رخ داده است")


# ========================Create End========================


# ========================Update Start========================


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
    is_for_business = graphene.Boolean(required=False)


class UpdateTransactionInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    title = graphene.String(required=False)
    due_date = graphene.Date(required=False)
    status = graphene.String(required=False)


class UpdateBusinessInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    is_confirmed = graphene.Boolean(required=True)


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
            if type not in ITEM_TYPE_CHOICES:
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
            if order.status in ("c", "de", "d", "ps"):
                errors["due_date"] = "شما توانایی تغییر تاریخ تحویل سفارش را ندارید"
            elif due_date < timezone.localdate() + timezone.timedelta(days=15):
                errors["due_date"] = "تاریخ تحویل باید دیرتر از 15 روز آینده باشد"
            else:
                order.due_date = due_date

        status = input.get("status")
        if status:
            if order.status in ("c", "de", "d", "ps"):
                errors["status"] = "شما توانایی تغییر وضعیت سفارش را ندارید"
            else:
                order.status = status

        address = input.get("address")

        if status == "p" and not address:
            errors["address"] = "آدرس نمی تواند خالی باشد"
        elif address and order.status in ("c", "de", "d", "ps"):
            errors["address"] = "شما توانایی تغییر آدرس سفارش را ندارید"
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

    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                order = Order.objects.get(pk=input.get("id"))
            except Order.DoesNotExist:
                return UpdateOrder(success=False, errors="سفارش مورد نظر یافت نشد")

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
            if {"length", "width", "height"} != set(dimensions.keys()):
                errors["dimensions"] = "طول، عرض و ارتفاع باید وارد شود"
            elif not all(
                isinstance(dimensions.get(key), int) and dimensions.get(key) > 0
                for key in {"length", "width", "height"}
            ):
                errors["dimensions"] = "طول، عرض و ارتفاع باید عدد طبیعی باشند"

            if display_item.type == "b" and "makeup table" in dimensions.keys():
                if {"length", "width", "height"} != set(
                    dimensions.get("makeup table").keys()
                ):
                    errors["dimensions"] = "طول، عرض و ارتفاع میز آرایش باید وارد شود"
                elif not all(
                    isinstance(dimensions.get("makeup table").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"length", "width", "height"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض و ارتفاع میز آرایش باید عدد طبیعی باشند"
                    )
            if display_item.type == "b" and "night stand" in dimensions.keys():
                if {"quantity", "length", "width", "height"} != set(
                    dimensions.get("night stand").keys()
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد پا تختی باید وارد شود"
                    )
                elif not all(
                    isinstance(dimensions.get("night stand").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"quantity", "length", "width", "height"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد پا تختی باید عدد طبیعی باشند"
                    )
            if display_item.type == "b" and "mirror" in dimensions.keys():
                if {"length", "width", "height"} not in dimensions.get("mirror").keys():
                    errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"

            if display_item.type == "m":
                if "chair" not in dimensions.keys():
                    errors["dimensions"] = " اطلاعات صندلی باید وارد شود"
                elif {"quantity", "length", "width", "height"} != set(
                    dimensions.get("chair").keys()
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد صندلی باید وارد شود"
                    )
                elif not all(
                    isinstance(dimensions.get("chair").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"quantity", "length", "width", "height"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد صندلی باید عدد طبیعی باشند"
                    )

            if display_item.type == "j":
                if "side table" not in dimensions.keys():
                    errors["dimensions"] = " اطلاعات عسلی باید وارد شود"
                elif {"quantity", "length", "width", "height"} != set(
                    dimensions.get("side table").keys()
                ):
                    errors["dimensions"] = "طول، عرض، ارتفاع و تعداد عسلی باید وارد شود"
                elif not all(
                    isinstance(dimensions.get("side table").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"quantity", "length", "width", "height"}
                ):
                    errors["dimensions"] = (
                        "طول، عرض، ارتفاع و تعداد عسلی باید عدد طبیعی باشند"
                    )

            if display_item.type == "c":
                if "mirror" not in dimensions.keys():
                    errors["dimensions"] = " اطلاعات آینه باید وارد شود"
                elif {"length", "width", "height"} not in dimensions.get(
                    "mirror"
                ).keys():
                    errors["dimensions"] = "طول، عرض و ارتفاع آینه باید وارد شود"
                elif not all(
                    isinstance(dimensions.get("mirror").get(key), int)
                    and dimensions.get(key) > 0
                    for key in {"length", "width", "height"}
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
            if not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", description):
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

        if input.get("is_for_business"):
            item_variant.is_for_business = input.get("is_for_business")

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

            item_variant, errors = UpdateItemVariant.validate_input(item_variant, input)
            if errors:
                return UpdateItemVariant(success=False, errors=errors)

            return UpdateItemVariant(success=True, item_variant=item_variant)
        except Exception as e:
            print(e)
            return UpdateItemVariant(success=False, errors="خطایی رخ داده است")


class UpdateTransaction(graphene.Mutation):
    class Arguments:
        input = UpdateTransactionInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    transaction = graphene.Field(OrderTransactionType)

    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                transaction = OrderTransaction.objects.get(pk=input.get("id"))
                input.pop("id")
            except OrderTransaction.DoesNotExist:
                return UpdateTransaction(
                    success=False, errors="فاکتور مورد نظر یافت نشد"
                )

            if transaction.status != "p":
                return UpdateTransaction(
                    success=False, errors="فاکتور قابل ویرایش نیست"
                )

            for key, value in input.items():
                setattr(transaction, key, value)

            transaction.save()

            return UpdateTransaction(success=True, transaction=transaction)
        except Exception as e:
            print(e)
            return UpdateTransaction(success=False, errors="خطایی رخ داده است")

class UpdateBusiness(graphene.Mutation):
    class Arguments:
        input = UpdateBusinessInput(required=True)
        
    success = graphene.Boolean()
    errors = graphene.String()
    business = graphene.Field(BusinessType)
    
    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                business = Business.objects.get(pk=input.get("id"))
                input.pop("id")
            except Business.DoesNotExist:
                return UpdateBusiness(
                    success=False, errors="شرکت مورد نظر یافت نشد"
                )
            
            business.is_confirmed = input.get("is_confirmed")
            business.save()
            
            return UpdateBusiness(success=True, business=business)
        except Exception as e:
            print(e)
            return UpdateBusiness(success=False, errors="خطایی رخ داده است")


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


class DeleteTransactionInput(graphene.InputObjectType):
    id = graphene.ID(required=True)


class DeleteOrderItem(graphene.Mutation):
    class Arguments:
        input = DeleteOrderItemInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    messages = graphene.String()

    @staff_member_required
    def mutate(self, info, input):
        try:

            try:
                order_item = OrderItem.objects.get(pk=input.id)
            except OrderItem.DoesNotExist:
                return DeleteOrderItem(success=False, errors="محصول مورد نظر یافت نشد")

            order = order_item.order
            if order.status != "ps":
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

    @staff_member_required
    def mutate(self, info, input):
        try:
            try:
                order = Order.objects.get(pk=input.id)
            except Order.DoesNotExist:
                return DeleteOrder(success=False, errors="سفارش مورد نظر پیدا نشد")

            if order.status != "ps":
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


class DeleteTransaction(graphene.Mutation):
    class Arguments:
        input = DeleteTransactionInput(required=True)

    success = graphene.Boolean()
    errors = graphene.String()
    messages = graphene.String()

    @staff_member_required
    def mutate(self, info, input):
        try:

            try:
                transcation = OrderTransaction.objects.get(pk=input.id)
            except OrderTransaction.DoesNotExist:
                return DeleteTransaction(
                    success=False, errors="تراکنش مورد نظر پیدا نشد"
                )

            if transcation.order.status != "ps":
                return DeleteTransaction(
                    success=False,
                    errors="شما دسترسی حذف این تراکنش را ندارید",
                )

            # Delete the Order
            transcation.delete()

            return DeleteTransaction(
                success=True, messages="تراکنش مورد نظر با موفقیت حذف شد"
            )

        except Exception as e:
            print(e)
            return DeleteTransaction(
                success=False, errors="خطایی رخ داده است. لطفا دوباره تلاش کنید"
            )


# ========================Delete End========================


class Mutation(graphene.ObjectType):
    create_display_item = CreateDisplayItem.Field()
    create_item_variant = CreateItemVariant.Field()
    create_transaction = CreateTransaction.Field()
    update_display_item = UpdateDisplayItem.Field()
    update_order = UpdateOrder.Field()
    update_item_variant = UpdateItemVariant.Field()
    update_transaction = UpdateTransaction.Field()
    update_business = UpdateBusiness.Field()
    delete_order_item = DeleteOrderItem.Field()
    delete_order = DeleteOrder.Field()
    delete_display_item = DeleteDisplayItem.Field()
    delete_item_variant = DeleteItemVariant.Field()
    delete_transaction = DeleteTransaction.Field()


# ========================Mutations End========================


# ========================Queries Start========================


class OrderFilterInput(graphene.InputObjectType):
    user__username__icontains = graphene.String()
    status = graphene.List(graphene.String)
    due_date__gte = graphene.Date()
    due_date__lte = graphene.Date()
    order_number__icontains = graphene.String()
    creation_date__lte = graphene.Date()
    creation_date__gte = graphene.Date()
    address__title__icontains = graphene.String()


class TranscationFilterInput(graphene.InputObjectType):
    order__user__username__icontains = graphene.String()
    order__id = graphene.ID()
    title__icontains = graphene.String()
    total_price__lte = graphene.BigInt()
    total_price__gte = graphene.BigInt()
    status = graphene.List(graphene.String)
    creation_date__lte = graphene.Date()
    creation_date__gte = graphene.Date()


class UserFilterInput(graphene.InputObjectType):
    username__icontains = graphene.String()
    first_name__icontains = graphene.String()
    last_name__icontains = graphene.String()
    phone_number__icontains = graphene.String()
    landline_number__icontains = graphene.String()
    email__icontains = graphene.String()
    position__icontains = graphene.String()
    birthdate__gte = graphene.Date()
    birthdate__lte = graphene.Date()
    is_fully_authenticated = graphene.Boolean()


class BusinessFilterInput(graphene.InputObjectType):
    user__username__icontains = graphene.String()
    name__icontains = graphene.String()
    owner_first_name__icontains = graphene.String()
    owner_last_name__icontains = graphene.String()
    owner_phone_number__icontains = graphene.String()
    is_confirmed = graphene.Boolean()


class PaginatedOrder(graphene.ObjectType):
    items = graphene.List(OrderType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class PaginatedTransaction(graphene.ObjectType):
    items = graphene.List(OrderTransactionType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class PaginatedUser(graphene.ObjectType):
    items = graphene.List(UserType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class PaginatedBusiness(graphene.ObjectType):
    items = graphene.List(BusinessType)
    total_pages = graphene.Int()
    total_items = graphene.Int()


class Query(graphene.ObjectType):
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

    users = graphene.Field(
        PaginatedUser,
        page=graphene.Int(),
        per_page=graphene.Int(),
        filter=UserFilterInput(),
    )

    businesses = graphene.Field(
        PaginatedBusiness,
        page=graphene.Int(),
        per_page=graphene.Int(),
        filter=BusinessFilterInput(),
    )

    @staff_member_required
    def resolve_orders(self, info, page=1, per_page=10, filter=None):
        orders = resolve_model_with_filters(Order, filter)
        paginator = Paginator(orders, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedOrder(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )

    @staff_member_required
    def resolve_order(self, info, id):
        return get_object_or_404(Order, pk=id)

    @staff_member_required
    def resolve_transactions(self, info, page=1, per_page=10, filter=None):
        transactions = resolve_model_with_filters(OrderTransaction, filter)
        paginator = Paginator(transactions, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedTransaction(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )

    @staff_member_required
    def resolve_transaction(self, info, id):
        return get_object_or_404(OrderTransaction, pk=id)

    @staff_member_required
    def resolve_users(self, info, page=1, per_page=10, filter=None):
        users = resolve_model_with_filters(User, filter)
        paginator = Paginator(users, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedUser(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )

    @staff_member_required
    def resolve_businesses(self, info, page=1, per_page=10, filter=None):
        businesses = resolve_model_with_filters(Business, filter)
        paginator = Paginator(businesses, per_page)
        paginated_qs = paginator.page(page)
        return PaginatedBusiness(
            items=paginated_qs.object_list,
            total_pages=paginator.num_pages,
            total_items=paginator.count,
        )


# ========================Queries End========================

schema = graphene.Schema(query=Query, mutation=Mutation)
