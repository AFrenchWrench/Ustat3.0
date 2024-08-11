from django.shortcuts import get_object_or_404
from graphql import GraphQLError
from main.models import BurnedTokens
from django.http import JsonResponse
from functools import wraps
import jwt
from django.conf import settings
from users.models import User


def main():
    pass


def resolve_model_with_filters(model_class, filter_input=None):
    queryset = model_class.objects.all()

    if filter_input:
        for field, value in filter_input.items():
            if isinstance(value, list):
                # Handle fields with multiple values
                if "__in" not in field:
                    field_name = field
                    queryset = queryset.filter(**{f"{field_name}__in": value})
                else:
                    # Preserve any existing filters for `__in` lookups
                    queryset = queryset.filter(**{field: value})
            else:
                # Handle relation-based lookups
                field_parts = field.split("__")
                if len(field_parts) > 1:
                    field_name = "__".join(
                        field_parts[:-1]
                    )  # All parts except the last
                    lookup_type = field_parts[-1]  # Last part is the lookup type
                    if lookup_type == "icontains":
                        queryset = queryset.filter(
                            **{f"{field_name}__icontains": value}
                        )
                    elif lookup_type == "iexact":
                        queryset = queryset.filter(**{f"{field_name}__iexact": value})
                    elif lookup_type == "gt":
                        queryset = queryset.filter(**{f"{field_name}__gt": value})
                    elif lookup_type == "lt":
                        queryset = queryset.filter(**{f"{field_name}__lt": value})
                    elif lookup_type == "gte":
                        queryset = queryset.filter(**{f"{field_name}__gte": value})
                    elif lookup_type == "lte":
                        queryset = queryset.filter(**{f"{field_name}__lte": value})
                    # Add other lookups as needed
                    else:
                        # Default behavior for unsupported lookups
                        queryset = queryset.filter(**{field: value})
                else:
                    # Handle exact matches by default
                    queryset = queryset.filter(**{field: value})

    return queryset


def login_required(func):
    def wrapper(root, info, *args, **kwargs):
        user = info.context.user
        token = info.context.headers.get("Authorization")
        try:
            BurnedTokens.objects.get(token=token)
            token = False
        except BurnedTokens.DoesNotExist:
            token = True
        if user.is_authenticated and token:
            return func(root, info, *args, **kwargs)
        else:
            raise GraphQLError("شما وارد حساب کاربری خود نشده اید")

    return wrapper


def staff_member_required(func):
    def wrapper(root, info, *args, **kwargs):
        user = info.context.user
        token = info.context.headers.get("Authorization")
        try:
            BurnedTokens.objects.get(token=token)
            token = False
        except BurnedTokens.DoesNotExist:
            token = True

        if user.is_authenticated and user.is_staff and token:
            return func(root, info, *args, **kwargs)
        else:
            raise GraphQLError("شما دسترسی انجام این عملیات را ندارید")

    return wrapper


def django_staff_member_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        token = request.headers.get("Authorization")

        try:
            BurnedTokens.objects.get(token=token)
            token_valid = False
        except BurnedTokens.DoesNotExist:
            token_valid = True

        if token_valid:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user = get_object_or_404(User, username=payload["username"])
            if user.is_authenticated and user.is_staff:
                return view_func(request, *args, **kwargs)
            else:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "شما دسترسی انجام این عملیات را ندارید",
                    },
                    status=403,
                )
        else:
            return JsonResponse(
                {
                    "success": False,
                    "message": "توکن شما نامعتبر است",
                },
                status=403,
            )

    return _wrapped_view


if __name__ == "__main__":
    main()
