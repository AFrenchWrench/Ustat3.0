from datetime import timedelta
import email
from hmac import compare_digest
import graphene
from django.contrib.auth import (
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
    Provinces,
)
from utils.schema_utils import (
    login_required,
)
from users.tasks import (
    send_code_email,
)
from utils.email_verification import generate_verification_code
from users.forms import (
    BusinessSignUpForm,
    UserSignUpForm,
    BusinessUpdateForm,
    UserUpdateForm,
)
from users.models import (
    User,
    Business,
    Driver,
)


def send_email(user, template):
    send_code_email.delay(
        user.get_full_name(),
        user.email,
        generate_verification_code(user.email),
        template,
    )


class UserType(DjangoObjectType):
    class Meta:
        model = User


class BusinessType(DjangoObjectType):
    class Meta:
        model = Business


class ProvinceType(DjangoObjectType):
    class Meta:
        model = Provinces


class CityType(DjangoObjectType):
    class Meta:
        model = Cities


# ========================Mutations Start========================


# ========================Create Start========================


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
            user = form.save()
            if business_data:
                business_form = BusinessSignUpForm(business_data)
                if business_form.is_valid():
                    business_form.save(user=user)
                else:
                    errors = business_form.errors.as_data()
                    error_messages = {
                        field: error[0].messages[0] for field, error in errors.items()
                    }
                    return CreateUser(
                        success=False,
                        errors=error_messages,
                        redirect_url="/auth/",
                    )
            send_email(user, "verification")
            return CreateUser(
                success=True,
                errors={},
                redirect_url="/auth/email-auth/",
            )
        else:
            errors = form.errors.as_data()
            error_messages = {
                field: error[0].messages[0] for field, error in errors.items()
            }
            return CreateUser(
                success=False,
                errors=error_messages,
                redirect_url="/auth/",
            )


class CreateBusiness(graphene.Mutation):
    class Arguments:
        business_data = BusinessInput(required=True)

    success = graphene.Boolean()
    errors = graphene.JSONString()
    redirect_url = graphene.String()

    @login_required
    def mutate(self, info, business_data):
        user = info.context.user
        business_form = BusinessSignUpForm(business_data)
        if business_form.is_valid():
            business_form.save(user=user)
            return CreateBusiness(
                success=True,
                errors=None,
                redirect_url=f"/users/{user.get_username()}",
            )
        else:
            errors = business_form.errors.as_data()
            error_messages = {
                field: error[0].messages[0] for field, error in errors.items()
            }
            return CreateBusiness(
                success=False,
                errors=error_messages,
                redirect_url=f"/users/{user.get_username()}",
            )


class CreateDriver(graphene.Mutation):
    class Arguments:
        input = DriverInput(required=True)

    success = graphene.Boolean()

    def mutate(self, info, data):
        driver_instance = Driver(**data)
        driver_instance.save()
        return CreateDriver(success=True)


# ========================Create End========================


# ========================Update Start========================


class UpdateUserInput(graphene.InputObjectType):
    username = graphene.String()
    first_name = graphene.String()
    last_name = graphene.String()
    old_password = graphene.String()
    password1 = graphene.String()
    password2 = graphene.String()
    phone_number = graphene.String()
    landline_number = graphene.String()
    email = graphene.String()
    city = graphene.String()
    birthdate = graphene.Date()


class UpdateBusinessInput(graphene.InputObjectType):
    name = graphene.String()
    owner_first_name = graphene.String()
    owner_last_name = graphene.String()
    owner_phone_number = graphene.String()
    address = graphene.String()


class UpdateUser(graphene.Mutation):
    class Arguments:
        user_data = UpdateUserInput()
        business_data = UpdateBusinessInput()

    success = graphene.Boolean()
    errors = graphene.JSONString()
    redirect_url = graphene.String()

    @login_required
    def mutate(self, info, user_data=None, business_data=None):
        user = info.context.user
        if not user_data and not business_data:
            return UpdateUser(
                success=False,
                errors="At least one input should be provided",
                redirect_url=f"/users/{user.get_username()}/",
            )

        if user_data:
            if user_data.get("old_password"):
                user = authenticate(
                    username=user.username, password=user_data.get("old_password")
                )
                if not user:
                    return UpdateUser(
                        success=False,
                        errors="Old password is not correct",
                        redirect_url=f"/users/{user.get_username()}/",
                    )
                elif compare_digest(
                    user_data.get("old_password"), user_data.get("password1")
                ) or compare_digest(
                    user_data.get("old_password"), user_data.get("password2")
                ):
                    return UpdateUser(
                        success=False,
                        errors="Your password is the same as your last one",
                        redirect_url=f"/users/{user.get_username()}/",
                    )
            form = UserUpdateForm(user_data, instance=user)
            if form.is_valid():
                user = form.save()
                if business_data:
                    try:
                        business_form = BusinessUpdateForm(
                            business_data, instance=user.business
                        )
                    except Business.DoesNotExist:
                        return UpdateUser(
                            success=False,
                            errors="You don't have a business account",
                            redirect_url=f"/users/{user.get_username()}/",
                        )
                    if business_form.is_valid():
                        business_form.save()
                    else:
                        errors = business_form.errors.as_data()
                        error_messages = {
                            field: error[0].messages[0]
                            for field, error in errors.items()
                        }
                        return UpdateUser(
                            success=False,
                            errors=error_messages,
                            redirect_url=f"/users/{user.get_username()}/",
                        )

                if not user.is_fully_authenticated:
                    token = info.context.headers.get("Authorization")
                    BurnedTokens.objects.create(token=token)
                    send_email(user, "verification")
                    return UpdateUser(
                        success=True,
                        errors={},
                        redirect_url="/auth/email-auth/",
                    )
                else:
                    return UpdateUser(
                        success=True,
                        errors={},
                        redirect_url=f"/users/{user.get_username()}/",
                    )
            else:
                errors = form.errors.as_data()
                error_messages = {
                    field: error[0].messages[0] for field, error in errors.items()
                }
                return UpdateUser(
                    success=False,
                    errors=error_messages,
                    redirect_url=f"/users/{user.get_username()}/",
                )
        elif business_data:
            try:
                business_form = BusinessUpdateForm(
                    business_data, instance=user.business
                )
            except Business.DoesNotExist:
                return UpdateUser(
                    success=False,
                    errors="You don't have a business account",
                    redirect_url=f"/users/{user.get_username()}/",
                )
            if business_form.is_valid():
                business_form.save()
            else:
                errors = business_form.errors.as_data()
                error_messages = {
                    field: error[0].messages[0] for field, error in errors.items()
                }
                return UpdateUser(
                    success=False,
                    errors=error_messages,
                    redirect_url=f"/users/{user.get_username()}/",
                )


# ========================Update End========================


# ========================Verification Start========================

r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)


class VerifyEmail(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()
    token = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        if info.context.headers.get("email"):
            user = get_object_or_404(User, email=info.context.headers.get("email"))
        else:
            user = get_object_or_404(
                User, username=info.context.headers.get("username")
            )
        stored_code = r.get(f"verification_code_{user.email}")
        if stored_code and stored_code.decode("utf-8") == code:
            user.is_fully_authenticated = True
            user.save()
            r.delete(f"verification_code_{user.email}")
            token = get_token(user)
            return VerifyEmail(
                success=True,
                error=None,
                redirect_url=f"/users/{user.get_username()}/",
                token=token,
            )
        return VerifyEmail(
            success=False,
            error="کد تایید وارد شده صحیح نمیباشد",
            redirect_url="/auth/email-auth/",
            token=None,
        )


# ========================Verification End========================


# ========================Auth Start========================


class ResendEmail(graphene.Mutation):

    success = graphene.Boolean()
    error = graphene.String()

    class Arguments:
        email_type = graphene.String(required=True)

    def mutate(self, info, email_type):
        try:
            if info.context.headers.get("email"):
                user = get_object_or_404(User, email=info.context.headers.get("email"))
            else:
                user = get_object_or_404(
                    User, username=info.context.headers.get("username")
                )
            send_email(
                user,
                email_type,
            )
            return ResendEmail(success=True, error=None)
        except Exception as e:
            return ResendEmail(success=False, error=str(e))


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
        elif user is not None and not user.is_fully_authenticated:
            send_email(
                user,
                "verification",
            )
            return Login(token=None, success=False, redirect_url="/auth/email-auth/")

        token = get_token(user)
        return Login(
            token=token, success=True, redirect_url=f"/users/{user.get_username()}/"
        )


class OtpLoginRequest(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()
    redirect_url = graphene.String()

    def mutate(self, info, email):
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

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise GraphQLError("Email Does Not Exists")

        if user is not None and not user.is_fully_authenticated:
            send_email(
                user,
                "verification",
            )
            return OtpLoginRequest(success=False, redirect_url="/auth/email-auth/")

        send_email(
            user,
            "otp",
        )
        return OtpLoginRequest(success=True, redirect_url=f"/auth/otp-login/")


r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)


class OtpLogin(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()
    token = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        user = get_object_or_404(User, email=info.context.headers.get("email"))
        stored_code = r.get(f"verification_code_{user.email}")
        if stored_code and stored_code.decode("utf-8") == code:
            r.delete(f"verification_code_{user.email}")
            token = get_token(user)
            return OtpLogin(
                success=True,
                error=None,
                redirect_url=f"/users/{user.get_username()}/",
                token=token,
            )
        return OtpLogin(
            success=False,
            error="کد وارد شده صحیح نمیباشد",
            redirect_url="/auth/otp-login/",
            token=None,
        )


class Logout(graphene.Mutation):
    success = graphene.Boolean()
    redirect_url = graphene.String()

    @staticmethod
    @login_required
    def mutate(self, info):
        token = info.context.headers.get("Authorization")
        BurnedTokens.objects.create(token=token)
        return Logout(success=True, redirect_url="/")


# ========================Auth End========================


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_business = CreateBusiness.Field()
    create_driver = CreateDriver.Field()
    update_user = UpdateUser.Field()
    login = Login.Field()
    otp_login_request = OtpLoginRequest.Field()
    otp_login = OtpLogin.Field()
    logout = Logout.Field()
    verify_email = VerifyEmail.Field()
    resend_email = ResendEmail.Field()


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
