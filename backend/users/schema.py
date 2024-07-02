from datetime import timedelta
import email
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
)
from utils.schema_utils import (
    login_required,
)
from .tasks import (
    send_code_email,
)
from utils.email_verification import generate_verification_code
from users.forms import (
    BusinessSignUpForm,
    UserSignUpForm,
    PasswordChangeForm,
)
from users.models import (
    Business,
    Driver,
)

User = get_user_model()


def send_email(info, user, template):
    send_code_email.delay(
        user.get_full_name(),
        user.email,
        generate_verification_code(user.email),
        template,
    )
    info.context.session["email"] = user.email
    info.context.session.set_expiry(timedelta(minutes=15))


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
                        success=False,
                        errors=error_messages,
                        redirect_url="/users/signup/",
                    )
            send_email(info, user_instance, "verification")
            return CreateUser(
                success=True,
                errors={},
                redirect_url="/users/email-auth/",
            )
        else:
            errors = form.errors.as_data()
            error_messages = {
                field: error[0].messages[0] for field, error in errors.items()
            }
            return CreateUser(
                success=False,
                errors=error_messages,
                redirect_url="/users/signup/",
            )


r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)


class VerifyEmail(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()
    token = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        print(info.context.session.items())
        user = get_object_or_404(User, email=info.context.session.get("email"))
        stored_code = r.get(f"verification_code_{user.email}")
        if stored_code and stored_code.decode("utf-8") == code:
            user.is_fully_authenticated = True
            user.save()
            r.delete(f"verification_code_{user.email}")
            info.context.session.clear()
            token = get_token(user)
            return VerifyEmail(
                success=True,
                error=None,
                redirect_url=f"/users/{user.get_username()}",
                token=token,
            )
        return VerifyEmail(
            success=False,
            error="کد تایید وارد شده صحیح نمیباشد",
            redirect_url="/users/email-auth/",
            token=None,
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
        elif user is not None and not user.is_fully_authenticated:
            send_email(
                info,
                user,
                "verification",
            )
            return Login(token=None, success=False, redirect_url="/users/email-auth/")

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
                info,
                user,
                "verification",
            )
            return OtpLoginRequest(success=False, redirect_url="/users/email-auth/")

        send_email(
            info,
            user,
            "otp",
        )
        return OtpLoginRequest(success=True, redirect_url=f"/users/otplogin/")


r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)


class OtpLogin(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()
    token = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        user = get_object_or_404(User, email=info.context.session.get("email"))
        stored_code = r.get(f"verification_code_{user.email}")
        if stored_code and stored_code.decode("utf-8") == code:
            r.delete(f"verification_code_{user.email}")
            info.context.session.clear()
            token = get_token(user)
            return OtpLogin(
                success=True,
                error=None,
                redirect_url=f"/users/{user.get_username()}",
                token=token,
            )
        return OtpLogin(
            success=False,
            error="کد وارد شده صحیح نمیباشد",
            redirect_url="/users/otplogin/",
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


class ForgotPasswordRequest(graphene.Mutation):
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
                info,
                user,
            )
            return ForgotPasswordRequest(
                success=False, redirect_url="/users/email-auth/"
            )

        send_email(
            info,
            user,
            "resetpass",
        )

        return ForgotPasswordRequest(
            success=True, redirect_url=f"/users/forgotpassword/"
        )


r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)


class ForgotPassword(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        user = get_object_or_404(User, email=info.context.session.get("email"))
        stored_code = r.get(f"verification_code_{user.email}")
        if stored_code and stored_code.decode("utf-8") == code:
            r.delete(f"verification_code_{user.email}")
            info.context.session["reset_pass_auth_complete"] = True
            info.context.session.set_expiry(timedelta(minutes=15))
            return ForgotPassword(
                success=True,
                error=None,
                redirect_url=f"/users/{user.get_username()}/resetpassword/",
            )
        return ForgotPassword(
            success=False,
            error="کد وارد شده صحیح نمیباشد",
            redirect_url="/users/forgotpassword/",
        )


class ResetPassword(graphene.Mutation):
    success = graphene.Boolean()
    error = graphene.String()
    redirect_url = graphene.String()

    class Arguments:
        password1 = graphene.String(required=True)
        password2 = graphene.String(required=True)

    def mutate(self, info, password1, password2):
        user = get_object_or_404(User, email=info.context.session.get("email"))
        if info.context.session.get("reset_pass_auth_complete"):
            print("KKK")
            form = PasswordChangeForm(password1, password2, instance=user)
            if form.is_valid():
                info.context.session.clear()
                return ResetPassword(
                    success=True,
                    error=None,
                    redirect_url=f"/users/{user.get_username()}/",
                )
            else:
                errors = form.errors.as_data()
                error_messages = {
                    field: error[0].messages[0] for field, error in errors.items()
                }
                return ResetPassword(
                    success=True,
                    error=error_messages,
                    redirect_url=f"/users/{user.get_username()}/resetpassword/",
                )


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_driver = CreateDriver.Field()
    login = Login.Field()
    otp_login_request = OtpLoginRequest.Field()
    otp_login = OtpLogin.Field()
    logout = Logout.Field()
    forgot_password_request = ForgotPasswordRequest.Field()
    forgot_password = ForgotPassword.Field()
    reset_password = ResetPassword.Field()
    verify_email = VerifyEmail.Field()


class Query(graphene.ObjectType):
    current_user = graphene.Field(UserType)

    @staticmethod
    @login_required
    def resolve_current_user(self, info):
        sender = info.context.user
        return sender


schema = graphene.Schema(query=Query, mutation=Mutation)
