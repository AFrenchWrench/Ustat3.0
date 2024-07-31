from time import timezone
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
    resolve_model_with_filters,
    staff_member_required,
)
from sales.models import (
    Order,
    OrderItem,
    DisplayItem,
    OrderTransaction,
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


class OrderTransactionType(DjangoObjectType):
    class Meta:
        model = OrderTransaction


class OrderItemInput(graphene.InputObjectType):
    order = graphene.ID(required=False)
    display_item = graphene.ID(required=True)
    due_date = graphene.Date(required=False)
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
                input["order"] = Order.objects.create(
                    user=info.context.user, due_date=input.get("due_date")
                )

            display_item = get_object_or_404(DisplayItem, id=input.pop("display_item"))
            input["type"] = display_item.type
            input["name"] = display_item.name
            input["dimensions"] = display_item.dimensions
            input["price"] = display_item.price

            existing_order_item = OrderItem.objects.filter(
                order=input["order"],
                type=input["type"],
                name=input["name"],
                dimensions=input["dimensions"],
                price=input["price"],
            ).first()
            if existing_order_item:
                existing_order_item.quantity += input.get("quantity", 1)
                existing_order_item.save()
                return CreateOrderItem(order_item=existing_order_item, success=True)

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
    dimensions = graphene.JSONString(required=False)
    description = graphene.String(required=False)
    quantity = graphene.Int(required=False)


class UpdateDisplayItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
    type = graphene.String(required=False)
    name = graphene.String(required=False)
    dimensions = graphene.JSONString(required=False)
    price = graphene.BigInt(required=False)
    description = graphene.String(required=False)


class UpdateOrderInput(graphene.InputObjectType):
    id = graphene.ID(required=True)  # ID of the order to update
    due_date = graphene.Date(required=False)
    status = graphene.String(required=False)


class UpdateOrderItem(graphene.Mutation):
    class Arguments:
        input = UpdateOrderItemInput(required=True)

    order_item = graphene.Field(OrderItemType)
    success = graphene.Boolean()

    @login_required
    def mutate(self, info, input):
        try:
            order_item = get_object_or_404(OrderItem, pk=input.get("id"))
            for field, value in input.items():
                setattr(order_item, field, value)
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

    @staff_member_required
    def mutate(self, info, input):
        try:
            display_item = get_object_or_404(DisplayItem, pk=input.get("id"))
            for field, value in input.items():
                setattr(display_item, field, value)
            display_item.save()
            return UpdateDisplayItem(display_item=display_item, success=True)
        except Exception as e:
            print(e)
            return UpdateDisplayItem(success=False)


class UpdateOrder(graphene.Mutation):
    class Arguments:
        input = UpdateOrderInput(required=True)

    order = graphene.Field(lambda: OrderType)
    success = graphene.Boolean()

    @login_required
    def mutate(self, info, input):
        try:
            order = Order.objects.get(pk=input.id)
        except Order.DoesNotExist:
            raise UpdateOrder(success=False)

        if order.user != info.context.user or order.status != "ps":
            raise UpdateOrder(success=False)

        if input.due_date and input.due_date > timezone.now():
            order.due_date = input.due_date
        else:
            raise UpdateOrder(success=False)

        if input.status and input.status == "p":
            order.status = input.status
        else:
            raise UpdateOrder(success=False)

        order.save()
        return UpdateOrder(order=order, success=True)


# ========================Update End========================

# ========================Delete Start========================


class DeleteOrderItemInput(graphene.InputObjectType):
    id = graphene.ID(required=True)  # ID of the order item to delete


class DeleteOrderInput(graphene.InputObjectType):
    id = graphene.ID(required=True)  # ID of the order to delete


class DeleteOrderItem(graphene.Mutation):
    class Arguments:
        input = DeleteOrderItemInput(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, input):
        user = info.context.user

        try:
            order_item = OrderItem.objects.get(pk=input.id)
        except OrderItem.DoesNotExist:
            return DeleteOrderItem(success=False, message="OrderItem not found")

        order = order_item.order
        if order.user != user or order.status != "p":
            return DeleteOrderItem(
                success=False, message="You do not have permission to delete this item"
            )

        transaction = order.transaction if hasattr(order, "transaction") else None

        # Delete the OrderItem
        order_item.delete()

        # Check if the Order has any remaining items
        if not order.items.exists():
            # Delete the Order
            if transaction:
                # Delete the associated OrderTransaction
                transaction.delete()
            order.delete()

        return DeleteOrderItem(
            success=True, message="OrderItem and related data deleted successfully"
        )


class DeleteOrder(graphene.Mutation):
    class Arguments:
        input = DeleteOrderInput(required=True)

    success = graphene.Boolean()
    message = graphene.String()  # To provide feedback on the operation

    @login_required
    def mutate(self, info, input):
        user = info.context.user

        try:
            order = get_object_or_404(Order, id=input.id)

            # Ensure the user owns the order
            if order.user != user:
                return DeleteOrder(
                    success=False,
                    message="You do not have permission to delete this order",
                )

            # Delete the associated OrderTransaction, if it exists
            if hasattr(order, "transaction"):
                order.transaction.delete()

            # Delete the Order
            order.delete()

            return DeleteOrder(success=True, message="Order deleted successfully")

        except Order.DoesNotExist:
            return DeleteOrder(success=False, message="Order not found")
        except Exception as e:
            print(e)
            return DeleteOrder(
                success=False, message="An error occurred while deleting the order"
            )


# ========================Delete End========================


class Mutation(graphene.ObjectType):
    create_order_item = CreateOrderItem.Field()
    create_display_item = CreateDisplayItem.Field()
    update_order_item = UpdateOrderItem.Field()
    update_display_item = UpdateDisplayItem.Field()
    update_order = UpdateOrder.Field()
    delete_order_item = DeleteOrderItem.Field()
    delete_order = DeleteOrder.Field()


# ========================Mutations End========================


# ========================Queries Start========================
class OrderFilterInput(graphene.InputObjectType):
    status = graphene.List(graphene.String)  # Filter by status
    due_date__gte = graphene.Date()  # Filter by minimum due date
    due_date__lte = graphene.Date()  # Filter by maximum due date
    order_number__icontains = graphene.String()  # Filter by order number
    creation_date__lte = graphene.Date()  # Filter by creation date before
    creation_date__gte = graphene.Date()  # Filter by creation date after


class Query(graphene.ObjectType):
    current_user = graphene.Field(UserType)
    display_items = graphene.List(DisplayItemType)
    display_item = graphene.Field(DisplayItemType, id=graphene.ID(required=True))
    user_orders = graphene.List(OrderType, filter=OrderFilterInput())

    @login_required
    def resolve_current_user(self, info):
        sender = info.context.user
        return sender

    def resolve_display_items(self, info):
        display_items = DisplayItem.objects.all()
        return display_items

    def resolve_display_item(self, info, id):
        display_item = get_object_or_404(DisplayItem, pk=id)
        return display_item

    @login_required
    def resolve_user_orders(self, info, filter=None):
        orders = resolve_model_with_filters(Order, filter)
        if info.context.user.is_staff:
            return orders
        else:
            return orders.filter(user=info.context.user)


# ========================Queries End========================

schema = graphene.Schema(query=Query, mutation=Mutation)
