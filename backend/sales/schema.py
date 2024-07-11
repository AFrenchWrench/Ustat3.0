import graphene
from django.contrib.auth import (
    get_user_model,
)
from django.shortcuts import get_object_or_404
from graphene_django import DjangoObjectType
from graphql import (
    GraphQLError,
)
from utils.schema_utils import (
    login_required,
    staff_member_required,
)
from sales.models import (
    Order,
    OrderItem,
    DisplayItem,
)
from users.schema import UserType

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


class OrderItemInput(graphene.InputObjectType):
    order = graphene.ID(required=False)
    due_date = graphene.Date(required=False)
    type = graphene.String(required=True)
    name = graphene.String(required=True)
    dimensions = graphene.JSONString(required=True)
    price = graphene.BigInt(required=True)
    description = graphene.String(required=False)
    quantity = graphene.Int(required=True)


class DisplayItemInput(graphene.InputObjectType):
    type = graphene.String(required=True)
    name = graphene.String(required=True)
    dimensions = graphene.JSONString(required=True)
    price = graphene.BigInt(required=True)
    description = graphene.String(required=True)


class CreateOrderItem(graphene.Mutation):
    class Arguments:
        input = OrderItemInput(required=True)

    order_item = graphene.Field(OrderItemType)
    success = graphene.Boolean()

    @login_required
    def mutate(self, info, input):
        try:
            if input.get("order"):
                input["order"] = get_object_or_404(Order, id=input.get("order"))
            else:
                input["order"] = Order.objects.create(due_date=input.get("due_date"))
            order_item = OrderItem.objects.create(
                **input,
            )

            return CreateOrderItem(order_item=order_item, success=True)
        except Exception as e:
            print(e)
            return CreateOrderItem(success=False)


class CreateDisplayItem(graphene.Mutation):
    class Arguments:
        input = DisplayItemInput(required=True)

    display_item = graphene.Field(DisplayItemType)
    success = graphene.Boolean()

    @staff_member_required
    def mutate(self, info, input):
        try:
            display_item = DisplayItem.objects.create(
                **input,
            )
            return CreateDisplayItem(display_item=display_item, success=True)
        except Exception as e:
            print(e)
            return CreateDisplayItem(success=False)


# ========================Create End========================


# ========================Update Start========================


class UpdateOrderItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    due_date = graphene.Date(required=False)
    status = graphene.String(required=False)
    dimensions = graphene.JSONString(required=False)
    description = graphene.String(required=False)
    quantity = graphene.Int(required=False)


class DisplayItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    type = graphene.String(required=False)
    name = graphene.String(required=False)
    dimensions = graphene.JSONString(required=False)
    price = graphene.BigInt(required=False)
    description = graphene.String(required=False)


class UpdateOrderItem(graphene.Mutation):
    class Arguments:
        input = OrderItemInput(required=True)

    order_item = graphene.Field(OrderItemType)
    success = graphene.Boolean()

    @login_required
    def mutate(self, info, input):
        try:
            order_item = get_object_or_404(OrderItem, pk=input.get("id"))
            for field, value in input:
                if field == "due_date" or field == "status":
                    setattr(order_item.order, field, value)
                    order_item.order.save()
                else:
                    setattr(order_item, field, value)
            order_item.save()
            return UpdateOrderItem(order_item=order_item, success=True)
        except Exception as e:
            print(e)
            return UpdateOrderItem(success=False)


class UpdateDisplayItem(graphene.Mutation):
    class Arguments:
        input = DisplayItemInput(required=True)

    display_item = graphene.Field(DisplayItemType)
    success = graphene.Boolean()

    @staff_member_required
    def mutate(self, info, input):
        try:
            display_item = get_object_or_404(DisplayItem, pk=input.get("id"))
            for field, value in input:
                setattr(display_item, field, value)
            display_item.save()
            return UpdateDisplayItem(display_item=display_item, success=True)
        except Exception as e:
            print(e)
            return UpdateDisplayItem(success=False)


# ========================Update End========================


class Mutation(graphene.ObjectType):
    create_order_item = CreateOrderItem.Field()
    create_display_item = CreateDisplayItem.Field()
    update_order_item = UpdateOrderItem.Field()
    update_display_item = UpdateDisplayItem.Field()


# ========================Mutations End========================


# ========================Queries Start========================


class Query(graphene.ObjectType):
    current_user = graphene.Field(UserType)

    @staticmethod
    @login_required
    def resolve_current_user(self, info):
        sender = info.context.user
        return sender


# ========================Queries End========================

schema = graphene.Schema(query=Query, mutation=Mutation)
