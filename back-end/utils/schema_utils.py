from graphql import GraphQLError
from main.models import BurnedTokens


def main():
    pass


def resolve_model_with_filters(model_class, filter_input=None):
    queryset = model_class.objects.all()
    if filter_input:
        for field, value in filter_input.items():
            if "__icontains" in field:
                field_name = field.split("__icontains")[0]
                print(field_name)
                queryset = queryset.filter(**{f"{field_name}__icontains": value})
            else:
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
            raise GraphQLError("Your are not logged in")

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
            raise GraphQLError("You do not have permission to perform this action.")

    return wrapper


if __name__ == "__main__":
    main()
