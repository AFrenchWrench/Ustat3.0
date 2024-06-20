import graphene
from django.contrib.auth import (
    get_user_model,
    authenticate,
)
from django.shortcuts import get_object_or_404
from graphene_django import DjangoObjectType
from graphql import (
    GraphQLError,
)
from graphql_jwt.shortcuts import get_token
import redis
from main.models import (
    BurnedTokens,
    Cities,
)
from utils.schema_utils import (
    login_required,
)
from .tasks import send_verification_email
from utils.email_verification import generate_verification_code
from users.forms import (
    BusinessSignUpForm,
    UserSignUpForm,
)
from users.models import (
    Business,
    Driver,
)

User = get_user_model()


class UserType(DjangoObjectType):
    class Meta:
        model = User


class BusinessType(DjangoObjectType):
    class Meta:
        model = Business


class DriverType(DjangoObjectType):
    class Meta:
        model = Driver


class UserInput(graphene.InputObjectType):
    username = graphene.String(required=True)
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)
    password1 = graphene.String(required=True)
    password2 = graphene.String(required=True)
    phone_number = graphene.String(required=True)
    landline_number = graphene.String(required=True)
    email = graphene.String(required=True)
    city = graphene.String(required=True)
    birthdate = graphene.Date(required=True)


class BusinessInput(graphene.InputObjectType):
    name = graphene.String(required=True)
    owner_first_name = graphene.String(required=True)
    owner_last_name = graphene.String(required=True)
    owner_phone_number = graphene.String(required=True)
    address = graphene.String(required=True)


class DriverInput(graphene.InputObjectType):
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)
    phone_number = graphene.String(required=True)
    national_code = graphene.String(required=True)
    plate_number = graphene.String(required=True)
    car_model = graphene.String(required=True)


class CreateUser(graphene.Mutation):
    class Arguments:
        user_data = UserInput(required=True)
        business_data = BusinessInput()

    success = graphene.Boolean()
    errors = graphene.JSONString()
    redirect_url = graphene.String()

    def mutate(self, info, user_data, business_data=None):
        form = UserSignUpForm(user_data)
        if form.is_valid():
            user_instance = form.save()
            if business_data:
                business_form = BusinessSignUpForm(business_data)
                if business_form.is_valid():
                    business_form.save(user=user_instance)
                else:
                    errors = business_form.errors.as_data()
                    error_messages = {
                        field: error[0].messages[0] for field, error in errors.items()
                    }
                    return CreateUser(
                        success=False, errors=error_messages, redirect_url="127.0.0.1/users/signup/"
                    )
            verification_code = generate_verification_code(user_instance.email)
            send_verification_email.delay(
                user_instance.get_full_name(),
                user_instance.email,
                verification_code,
            )
            info.context.session['email'] = user_instance.email
            return CreateUser(
                success=True,
                errors={},
                redirect_url="127.0.0.1/users/email-auth/",
            )
        else:
            errors = form.errors.as_data()
            error_messages = {
                field: error[0].messages[0] for field, error in errors.items()
            }
            return CreateUser(success=False, errors=error_messages, redirect_url="127.0.0.1/users/signup/")


r = redis.StrictRedis(host="localhost", port=6379, db=0)


class VerifyEmail(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        user = get_object_or_404(User, email=info.context.session.get('email'))
        stored_code = r.get(f"verification_code_{user.email}")
        if stored_code and stored_code.decode("utf-8") == code:
            user.is_fully_authenticated = True
            user.save()
            r.delete(f"verification_code_{user.email}")
            info.context.session.clear()
            return VerifyEmail(
                success=True,
                error=None,
                redirect_url=f"127.0.0.1/users/{user.get_username()}",
            )
        return VerifyEmail(
            success=False, error="کد تایید وارد شده صحیح نمیباشد", redirect_url="127.0.0.1/users/email-auth/"
        )


class CreateDriver(graphene.Mutation):
    class Arguments:
        input = DriverInput(required=True)

    success = graphene.Boolean()

    def mutate(self, info, data):
        driver_instance = Driver(**data)
        driver_instance.save()
        return CreateDriver(success=True)


class Login(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    success = graphene.Boolean()
    redirect_url = graphene.String()

    def mutate(self, info, username, password):
        sender = info.context.user
        try:
            token = BurnedTokens.objects.get(
                token=info.context.headers.get("Authorization")
            )
            token = False
        except BurnedTokens.DoesNotExist:
            token = True
        if sender.is_authenticated and token:
            raise GraphQLError("You are already logged in")

        user = authenticate(username=username, password=password)
        if user is None:
            raise GraphQLError("Invalid username or password")
        # elif user is not None and not user.is_fully_authenticated:
        #     return Login(
        #         token=None, success=False, redirect_url="127.0.0.1/users/email-auth/"
        #     )

        token = get_token(user)
        return Login(
            token=token, success=True, redirect_url=f"127.0.0.1/users/{user.username}/"
        )


class Logout(graphene.Mutation):
    success = graphene.Boolean()
    redirect_url = graphene.String()

    @staticmethod
    @login_required
    def mutate(self, info):
        token = info.context.headers.get("Authorization")
        BurnedTokens.objects.create(token=token)
        return Logout(success=True, redirect_url="127.0.0.1/")


# class ResetPasswordRequest(graphene.Mutation):
#     success = graphene.Boolean()

#     class Arguments:
#         email = graphene.String(required=True)

#     @staticmethod
#     def mutate(self, info, email):
#         user = get_object_or_404(User, email=email)
#         subject = "Reset your password"
#         token = get_random_string(length=32)

#         text = f"""
#         Hi {user.get_full_name()} ... \n Your token is {token}
#                """
#         send = send_email(email, subject, text)
#         r = Redis(host="localhost", port=6379, db=0)
#         r.set(token, email)
#         r.expire(token, 60 * 2 * 1)  # 2 minutes
#         return ResetPasswordRequest(success=send)


# class ResetPassword(graphene.Mutation):
#     success = graphene.Boolean()

#     class Arguments:
#         tk = graphene.String(required=True)
#         email = graphene.String(required=True)
#         new_password = graphene.String(required=True)

#     @staticmethod
#     def mutate(self, info, tk, email, new_password):
#         r = Redis(host="localhost", port=6379, db=0)
#         stored_email = r.get(tk)

#         print(stored_email)
#         if not stored_email or stored_email.decode("utf-8") != email:
#             raise GraphQLError("Invalid token or email")
#         user = get_object_or_404(User, email=email)

#         form = UpdateUserForm({"password": new_password})
#         if form.is_valid():
#             user.set_password(new_password)
#             user.save()

#             r.delete(tk)

#             return ResetPassword(success=True)
#         else:
#             errors = form.errors.as_data()
#             error_messages = [error[0].messages[0] for error in errors.values()]
#             raise GraphQLError(", ".join(error_messages))


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_driver = CreateDriver.Field()
    login = Login.Field()
    logout = Logout.Field()
    verify_email = VerifyEmail.Field()


class Query(graphene.ObjectType):
    current_user = graphene.Field(UserType)

    @staticmethod
    @login_required
    def resolve_current_user(self, info):
        sender = info.context.user
        return sender


schema = graphene.Schema(query=Query, mutation=Mutation)
