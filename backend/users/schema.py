from hmac import compare_digest
from typing import Required
from django.utils import timezone
import re
import graphene
from django.contrib.auth import (
    authenticate,
)
from django.shortcuts import get_object_or_404
from graphene_django import DjangoObjectType
from graphql_jwt.shortcuts import get_token
import redis
from utils.validation_utils import is_persian_string
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
from users.models import (
    Address,
    User,
    Business,
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


class AddressType(DjangoObjectType):
    class Meta:
        model = Address


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
    birthdate = graphene.Date(required=True)


class BusinessInput(graphene.InputObjectType):
    name = graphene.String(required=True)
    owner_first_name = graphene.String(required=True)
    owner_last_name = graphene.String(required=True)
    owner_phone_number = graphene.String(required=True)


class AddressInput(graphene.InputObjectType):
    title = graphene.String(required=True)
    province = graphene.ID(required=True)
    city = graphene.ID(required=True)
    address = graphene.String(required=True)
    postal_code = graphene.String(required=True)


class CreateUser(graphene.Mutation):
    class Arguments:
        user_data = UserInput(required=True)
        business_data = BusinessInput()

    success = graphene.Boolean()
    errors = graphene.JSONString()
    redirect_url = graphene.String()

    @staticmethod
    def validate_input(user_data):
        errors = {}

        username = user_data.get("username")
        if User.objects.filter(username=username).exists():
            errors["username"] = "نام کاربری وارد شده در سیستم وجود دارد"
        elif not re.match("^[a-zA-Z][a-zA-Z0-9_]{4,20}$", username):
            errors["username"] = "نام کاربری معتبر نمیباشد"

        password1 = user_data.get("password1")
        password2 = user_data.get("password2")
        if not compare_digest(password1, password2):
            errors["password2"] = "تکرار رمز عبور اشتباه است"
        elif len(password1) < 8:
            errors["password1"] = "رمز عبور باید حداقل 8 کاراکتر باشد"
        elif not re.search("[a-z]", password1):
            errors["password1"] = "رمز عبور باید حداقل شامل یک حرف کوچک باشد"
        elif not re.search("[A-Z]", password1):
            errors["password1"] = "رمز عبور باید حداقل شامل یک حرف بزرگ باشد"
        elif not re.search("[0-9]", password1):
            errors["password1"] = "رمز عبور باید حداقل شامل یک عدد باشد"
        elif not re.search("[_@$]", password1):
            errors["password1"] = "رمز عبور باید حداقل شامل یک علامت (@, $, _) باشد"

        phone_number = user_data.get("phone_number")
        if User.objects.filter(phone_number=phone_number).exists():
            errors["phone_number"] = "شماره تلفن وارد شده در سیستم وجود دارد"
        elif not re.match(r"^\+\d{9,15}$", phone_number):
            errors["phone_number"] = "شماره تلفن معتبر نمیباشد"

        landline_number = user_data.get("landline_number")
        if User.objects.filter(landline_number=landline_number).exists():
            errors["landline_number"] = "شماره ثابت وارد شده در سیستم وجود دارد"
        elif not re.match(r"^\+\d{9,15}$", landline_number):
            errors["landline_number"] = "شماره ثابت معتبر نمیباشد"

        email = user_data.get("email")
        if User.objects.filter(email=email).exists():
            errors["email"] = "ایمیل وارد شده در سیستم وجود دارد"

        first_name = user_data.get("first_name")
        if not is_persian_string(first_name):
            errors["first_name"] = "نام شما باید فارسی باشد"

        last_name = user_data.get("last_name")
        if not is_persian_string(last_name):
            errors["last_name"] = "نام خانوادگی شما باید فارسی باشد"

        birthdate = user_data.get("birthdate")
        if birthdate >= timezone.localdate():
            errors["birthdate"] = "تاریخ تولد باید گذشته باشد"
        elif birthdate > (timezone.localdate() - timezone.timedelta(days=(365.25 * 18))):
            errors["birthdate"] = "شما حداقل باید 18 سال سن داشته باشید"

        return errors

    def mutate(self, info, user_data, business_data=None):
        try:
            errors = CreateUser.validate_input(user_data)
            if errors:
                return CreateUser(success=False, errors=errors, redirect_url="/auth/")
            else:
                user = User.objects.create_user(**user_data)
                if business_data:
                    business_errors = CreateBusiness.validate_input(business_data)
                    if business_errors:
                        return CreateUser(
                            success=False, errors=business_errors, redirect_url="/auth/"
                        )
                    else:
                        business = Business.objects.create(user=user, **business_data)
                        business.save()
                user.save()
                send_email(user, "verification")
                return CreateUser(
                    success=True,
                    errors=None,
                    redirect_url="/auth/email-auth/",
                )
        except Exception as e:
            print(e)
            return CreateUser(
                success=False,
                errors="خطایی رخ داده است",
                redirect_url="/auth/",
            )


class CreateBusiness(graphene.Mutation):
    class Arguments:
        business_data = BusinessInput(required=True)

    success = graphene.Boolean()
    errors = graphene.JSONString()
    redirect_url = graphene.String()

    @staticmethod
    def validate_input(business_data):
        errors = {}

        name = business_data.get("name")
        if not is_persian_string(name):
            errors["name"] = "نام شرکت باید فارسی باشد"
        elif Business.objects.filter(name=name).exists():
            errors["name"] = "نام شرکت وارد شده در سیستم وجود دارد"

        owner_first_name = business_data.get("owner_first_name")
        if not is_persian_string(owner_first_name):
            errors["owner_first_name"] = "نام مدیر شرکت باید فارسی باشد"

        owner_last_name = business_data.get("owner_last_name")
        if not is_persian_string(owner_last_name):
            errors["owner_last_name"] = "نام خانوادگی مدیر شرکت باید فارسی باشد"

        owner_phone_number = business_data.get("owner_phone_number")
        if not re.match(r"^\+\d{9,15}$", owner_phone_number):
            errors["owner_phone_number"] = "شماره تلفن مدیر شرکت معتبر نمیباشد"

        return errors

    @login_required
    def mutate(self, info, business_data):
        try:
            errors = CreateBusiness.validate_input(business_data)
            if errors:
                return CreateBusiness(
                    success=False,
                    errors=errors,
                    redirect_url=f"/users/{info.context.user.get_username()}",
                )
            else:
                business = Business.objects.create(
                    user=info.context.user, **business_data
                )
                business.save()
                return CreateBusiness(
                    success=True,
                    errors=None,
                    redirect_url=f"/users/{info.context.user.get_username()}",
                )
        except Exception as e:
            print(e)
            return CreateBusiness(
                success=False,
                errors="خطایی رخ داده است",
                redirect_url=f"/users/{info.context.user.get_username()}",
            )


class CreateAddress(graphene.Mutation):
    class Arguments:
        input = AddressInput(required=True)

    address = graphene.Field(AddressType)
    success = graphene.Boolean()
    errors = graphene.JSONString()

    @staticmethod
    def validate_input(user, input):
        errors = {}

        # Validate title
        title = input.get("title")
        if not is_persian_string(title):
            errors["title"] = "عنوان ادرس باید فارسی باشد"
        elif Address.objects.filter(user=user, title=title).exists():
            errors["title"] = "عنوان ادرس تکراری است"

        # Validate province
        try:
            Provinces.objects.get(name=input.get("province"))
        except Provinces.DoesNotExist:
            errors["province"] = "استان مورد نظر در سیستم وجود ندارد"

        # Validate city
        try:
            Cities.objects.get(name=input.get("city"))
        except Cities.DoesNotExist:
            errors["city"] = "شهر مورد نظر در سیستم وجود ندارد"

        # Validate address
        address = input.get("address")
        if not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", address):
            errors["address"] = (
                "در آدرس تنها از حروف فارسی، اعداد انگلیسی، ویرگول و یا قاصله استفاده کنید"
            )

        postal_code = input.get("postal_code")
        if len(postal_code) != 10 or not postal_code.isdigit():
            errors["postal_code"] = "کد پستی معتبر نمیباشد"

        return errors

    @login_required
    def mutate(self, info, input):
        try:
            errors = CreateAddress.validate_input(info.context.user, input)
            if errors:
                return CreateAddress(success=False, errors=errors)

            address = Address.objects.create(
                title=input.title,
                province=Provinces.objects.get(name=input.province),
                city=Cities.objects.get(name=input.city),
                address=input.address,
                postal_code=input.postal_code,
            )
            address.save()
            return CreateAddress(address=address, success=True)
        except Exception as e:
            print(e)
            return CreateAddress(success=False, errors="خطایی رخ داده است")


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


class UpdateAddressInput(graphene.InputObjectType):
    id = graphene.ID(Required=True)
    title = graphene.String()
    province = graphene.ID()
    city = graphene.ID()
    address = graphene.String()
    postal_code = graphene.String()


class UpdateUser(graphene.Mutation):
    class Arguments:
        user_data = UpdateUserInput()
        business_data = UpdateBusinessInput()

    success = graphene.Boolean()
    errors = graphene.JSONString()
    redirect_url = graphene.String()

    @staticmethod
    def validate_user_input(user, user_data):
        errors = {}
        user = user
        username_changed = False
        password_changed = False
        email_changed = False

        username = user_data.get("username")
        if username:
            if User.objects.filter(username=username).exists():
                errors["username"] = "نام کاربری وارد شده در سیستم وجود دارد"
            elif not re.match("^[a-zA-Z][a-zA-Z0-9_]{4,20}$", username):
                errors["username"] = "نام کاربری معتبر نمیباشد"
            else:
                user.username = username
                username_changed = True

        old_password = user_data.get("old_password")
        password1 = user_data.get("password1")
        password2 = user_data.get("password2")

        if old_password and password1 and password2:
            if not user.check_password(old_password):
                errors["old_password"] = "رمز عبور فعلی اشتباه است"
            elif compare_digest(old_password, password1) or compare_digest(
                old_password, password2
            ):
                errors["password1"] = (
                    "رمز عبور جدید نمیتواند با رمز عبور فعلی یکسان باشد"
                )
            elif not compare_digest(password1, password2):
                errors["password2"] = "تکرار رمز عبور اشتباه است"
            elif len(password1) < 8:
                errors["password1"] = "رمز عبور باید حداقل 8 کاراکتر باشد"
            elif not re.search("[a-z]", password1):
                errors["password1"] = "رمز عبور باید حداقل شامل یک حرف کوچک باشد"
            elif not re.search("[A-Z]", password1):
                errors["password1"] = "رمز عبور باید حداقل شامل یک حرف بزرگ باشد"
            elif not re.search("[0-9]", password1):
                errors["password1"] = "رمز عبور باید حداقل شامل یک عدد باشد"
            elif not re.search("[_@$]", password1):
                errors["password1"] = "رمز عبور باید حداقل شامل یک علامت (@, $, _) باشد"
            else:
                user.set_password(password1)
                password_changed = True

        phone_number = user_data.get("phone_number")
        if phone_number:
            if User.objects.filter(phone_number=phone_number).exists():
                errors["phone_number"] = "شماره تلفن وارد شده در سیستم وجود دارد"
            elif not re.match(r"^\+\d{9,15}$", phone_number):
                errors["phone_number"] = "شماره تلفن معتبر نمیباشد"
            else:
                user.phone_number = phone_number

        landline_number = user_data.get("landline_number")
        if landline_number:
            if User.objects.filter(landline_number=landline_number).exists():
                errors["landline_number"] = "شماره ثابت وارد شده در سیستم وجود دارد"
            elif not re.match(r"^\+\d{9,15}$", landline_number):
                errors["landline_number"] = "شماره ثابت معتبر نمیباشد"
            else:
                user.landline_number = landline_number

        email = user_data.get("email")
        if email:
            if User.objects.filter(email=email).exists():
                errors["email"] = "ایمیل وارد شده در سیستم وجود دارد"
            else:
                user.email = email
                email_changed = True

        first_name = user_data.get("first_name")
        if first_name:
            if not is_persian_string(first_name):
                errors["first_name"] = "نام شما باید فارسی باشد"
            else:
                user.first_name = first_name

        last_name = user_data.get("last_name")
        if last_name:
            if not is_persian_string(last_name):
                errors["last_name"] = "نام خانوادگی شما باید فارسی باشد"
            else:
                user.last_name = last_name

        birthdate = user_data.get("birthdate")
        if birthdate:
            if birthdate >= timezone.localdate():
                errors["birthdate"] = "تاریخ تولد باید گذشته باشد"
            elif birthdate > (
                timezone.localdate() - timezone.timedelta(days=(365.25 * 18))
            ):
                errors["birthdate"] = "شما حداقل باید 18 سال سن داشته باشید"
            else:
                user.birthdate = birthdate

        if not errors:
            if email_changed:
                user.is_fully_authenticated = False
            user.save()

        return user, errors, username_changed, password_changed

    @staticmethod
    def validate_business_input(business, business_data):
        errors = {}
        business = business

        name = business_data.get("name")
        if name:
            if not is_persian_string(name):
                errors["name"] = "نام شرکت باید فارسی باشد"
            elif Business.objects.filter(name=name).exists():
                errors["name"] = "نام شرکت وارد شده در سیستم وجود دارد"
            else:
                business.name = name

        owner_first_name = business_data.get("owner_first_name")
        if owner_first_name:
            if not is_persian_string(owner_first_name):
                errors["owner_first_name"] = "نام مدیر شرکت باید فارسی باشد"
            else:
                business.owner_first_name = owner_first_name

        owner_last_name = business_data.get("owner_last_name")
        if owner_last_name:
            if not is_persian_string(owner_last_name):
                errors["owner_last_name"] = "نام خانوادگی مدیر شرکت باید فارسی باشد"
            else:
                business.owner_last_name = owner_last_name

        owner_phone_number = business_data.get("owner_phone_number")
        if owner_phone_number:
            if not re.match(r"^\+\d{9,15}$", owner_phone_number):
                errors["owner_phon  e_number"] = "شماره تلفن مدیر شرکت معتبر نمیباشد"
            else:
                business.owner_phone_number = owner_phone_number

        if not errors:
            business.is_confirmed = False
            business.save()

        return business, errors

    @login_required
    def mutate(self, info, user_data=None, business_data=None):
        try:
            user = info.context.user
            if not user_data and not business_data:
                return UpdateUser(
                    success=False,
                    errors="حداقل یک وروردی جهت تغییر دادن اطلاعات نیاز است",
                    redirect_url=f"/users/{user.get_username()}/",
                )

            if user_data:
                user, errors, username_changed, password_changed = (
                    UpdateUser.validate_user_input(user, user_data)
                )

                if errors:
                    return UpdateUser(
                        success=False,
                        errors=errors,
                        redirect_url=f"/users/{user.get_username()}/",
                    )
                else:
                    if business_data:
                        try:
                            business = Business.objects.get(user=user)
                        except Business.DoesNotExist:
                            return UpdateUser(
                                success=False,
                                errors="حساب کاربری شما شرکتی نمیباشد",
                                redirect_url=f"/users/{user.get_username()}/",
                            )

                        business, business_errors = UpdateUser.validate_business_input(
                            business, business_data
                        )
                        if business_errors:
                            return UpdateUser(
                                success=False,
                                errors=business_errors,
                                redirect_url=f"/users/{user.get_username()}/",
                            )
                    if (
                        not user.is_fully_authenticated
                        or username_changed
                        or password_changed
                    ):
                        token = info.context.headers.get("Authorization")
                        BurnedTokens.objects.create(token=token)
                        return UpdateUser(
                            success=True,
                            errors=None,
                            redirect_url="/auth/",
                        )
                    else:
                        return UpdateUser(
                            success=True,
                            errors=None,
                            redirect_url=f"/users/{user.get_username()}/",
                        )
            elif business_data:
                try:
                    business = Business.objects.get(user=user)
                except Business.DoesNotExist:
                    return UpdateUser(
                        success=False,
                        errors="حساب کاربری شما شرکتی نمیباشد",
                        redirect_url=f"/users/{user.get_username()}/",
                    )

                business, business_errors = UpdateUser.validate_business_input(
                    business, business_data
                )
                if business_errors:
                    return UpdateUser(
                        success=False,
                        errors=business_errors,
                        redirect_url=f"/users/{user.get_username()}/",
                    )
                else:
                    return UpdateUser(
                        success=True,
                        errors=None,
                        redirect_url=f"/users/{user.get_username()}/",
                    )
        except Exception as e:
            print(e)
            return UpdateUser(
                success=False,
                errors="خطایی رخ داده است",
                redirect_url=f"/users/{user.get_username()}/",
            )


class UpdateAddress(graphene.Mutation):

    success = graphene.Boolean()
    errors = graphene.JSONString()
    address = AddressType()

    class Arguments:
        input = UpdateAddressInput(required=True)

    @staticmethod
    def validate_input(user, address, input):
        errors = {}
        address = address

        # Validate title
        title = input.get("title")
        if title:
            if not is_persian_string(title):
                errors["title"] = "عنوان ادرس باید فارسی باشد"
            elif Address.objects.filter(user=user, title=title).exists():
                errors["title"] = "عنوان ادرس تکراری است"
            else:
                address.title = title

        # Validate province
        province = input.get("province")
        if province:
            try:
                province = Provinces.objects.get(name=province)
                address.province = province
            except Provinces.DoesNotExist:
                errors["province"] = "استان مورد نظر در سیستم وجود ندارد"

        # Validate city
        city = input.get("city")
        if city:
            try:
                city = Cities.objects.get(name=city)
                address.city = city
            except Cities.DoesNotExist:
                errors["city"] = "شهر مورد نظر در سیستم وجود ندارد"

        # Validate address
        address_text = input.get("address")
        if address_text:
            if not re.fullmatch(r"^[\u0600-\u06FF0-9\s,]+$", address_text):
                errors["address"] = (
                    "در آدرس تنها از حروف فارسی، اغداد انگلیسی، و ویرگول و یا قاصله استفاده کنید"
                )
            else:
                address.address = address_text

        postal_code = input.get("postal_code")
        if postal_code:
            if len(postal_code) != 10 or not postal_code.isdigit():
                errors["postal_code"] = "کد پستی معتبر نمیباشد"
            else:
                address.postal_code = postal_code

        if not errors:
            address.save()

        return address, errors

    @login_required
    def mutate(self, info, input):
        try:
            user = info.context.user
            try:
                address = Address.objects.get(id=input.get("id"))
            except Address.DoesNotExist:
                return UpdateAddress(
                    success=False,
                    errors="آدرس مورد نظر در سیستم وجود ندارد",
                )

            if address.user != user:
                return UpdateAddress(
                    success=False,
                    errors="شما اجازه دسترسی به این آدرس را ندارید",
                )

            address, errors = UpdateAddress.validate_input(user, address, input)

            if errors:
                return UpdateAddress(
                    success=False,
                    errors=errors,
                )
            else:
                return UpdateAddress(
                    address=address,
                    success=True,
                    errors=None,
                )
        except Exception as e:
            print(e)
            return UpdateAddress(
                success=False,
                errors="خطایی رخ داده است",
            )


# ========================Update End========================

# ========================Delete Start========================


class DeleteAddress(graphene.Mutation):
    class Arguments:
        address_id = graphene.ID(required=True)

    success = graphene.Boolean()
    errors = graphene.String()

    @login_required
    def mutate(self, info, address_id):
        try:
            user = info.context.user
            try:
                address = Address.objects.get(id=address_id)
            except Address.DoesNotExist:
                return DeleteAddress(
                    success=False, errors="آدرس مورد نظر در سیستم وجود ندارد"
                )

            if address.user != user:
                return DeleteAddress(
                    success=False, errors="آدرس مورد نظر متعلق به کاربر دیگری است"
                )
            address.delete()

            return DeleteAddress(success=True, errors=None)
        except Exception as e:
            print(e)
            return DeleteAddress(success=False, errors="خطایی رخ داده است")


# ========================Delete End========================


# ========================Verification Start========================

r = redis.StrictRedis(host="redis", port=6379, db=0)


class VerifyEmail(graphene.Mutation):
    success = graphene.Boolean()
    errors = graphene.String()
    redirect_url = graphene.String()
    token = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        try:
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
                    errors=None,
                    redirect_url=f"/users/{user.get_username()}/",
                    token=token,
                )
            return VerifyEmail(
                success=False,
                errors="کد تایید وارد شده صحیح نمیباشد",
                redirect_url="/auth/email-auth/",
                token=None,
            )
        except Exception as e:
            print(e)
            return VerifyEmail(
                success=False,
                errors="خطایی رخ داده است",
                redirect_url="/auth/email-auth/",
                token=None,
            )


# ========================Verification End========================


# ========================Auth Start========================


class ResendEmail(graphene.Mutation):

    success = graphene.Boolean()
    errors = graphene.String()

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
            return ResendEmail(success=True, errors=None)
        except Exception as e:
            print(e)
            return ResendEmail(success=False, errors="خطایی رخ داده است")


class Login(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    success = graphene.Boolean()
    errors = graphene.String()
    redirect_url = graphene.String()

    def mutate(self, info, username, password):
        try:
            sender = info.context.user
            try:
                token = BurnedTokens.objects.get(
                    token=info.context.headers.get("Authorization")
                )
                token = False
            except BurnedTokens.DoesNotExist:
                token = True

            if sender.is_authenticated and token:
                return Login(
                    success=False,
                    token=None,
                    redirect_url="/",
                    errors="شما قبلا وارد شده اید",
                )

            user = authenticate(username=username, password=password)
            if user is None:
                return Login(
                    token=None,
                    success=False,
                    redirect_url="/auth/",
                    errors="نام کاربری یا رمز عبور اشتباه است",
                )
            elif user is not None and not user.is_fully_authenticated:
                send_email(
                    user,
                    "verification",
                )
                return Login(
                    token=None,
                    success=False,
                    redirect_url="/auth/email-auth/",
                    errors="ایمیل شما تایید نشده است",
                )

            token = get_token(user)
            return Login(
                token=token, success=True, redirect_url=f"/users/{user.get_username()}/"
            )
        except Exception as e:
            print(e)
            return Login(
                token=None,
                success=False,
                redirect_url="/auth/",
                errors="خطایی رخ داده است",
            )


class OtpLoginRequest(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()
    redirect_url = graphene.String()
    errors = graphene.String()

    def mutate(self, info, email):
        try:
            sender = info.context.user
            try:
                token = BurnedTokens.objects.get(
                    token=info.context.headers.get("Authorization")
                )
                token = False
            except BurnedTokens.DoesNotExist:
                token = True

            if sender.is_authenticated and token:
                return OtpLoginRequest(
                    success=False,
                    redirect_url="/",
                    errors="شما قبلا وارد شده اید",
                )

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return OtpLoginRequest(
                    success=False,
                    redirect_url="/auth/otp-login-request/",
                    errors="ایمیل وارد شده معتبر نمیباشد",
                )
            if user is not None and not user.is_fully_authenticated:
                send_email(
                    user,
                    "verification",
                )
                return OtpLoginRequest(
                    success=False,
                    redirect_url="/auth/email-auth/",
                    errors="ایمیل شما تایید نشده است",
                )

            send_email(
                user,
                "otp",
            )
            return OtpLoginRequest(success=True, redirect_url=f"/auth/otp-login/")
        except Exception as e:
            print(e)
            return OtpLoginRequest(
                success=False,
                redirect_url="/auth/otp-login-request/",
                errors="خطایی رخ داده است",
            )


r = redis.StrictRedis(host="redis", port=6379, db=0)


class OtpLogin(graphene.Mutation):
    success = graphene.Boolean()
    errors = graphene.String()
    redirect_url = graphene.String()
    token = graphene.String()

    class Arguments:
        code = graphene.String(required=True)

    def mutate(self, info, code):
        try:
            user = get_object_or_404(User, email=info.context.headers.get("email"))
            stored_code = r.get(f"verification_code_{user.email}")
            if stored_code and stored_code.decode("utf-8") == code:
                r.delete(f"verification_code_{user.email}")
                token = get_token(user)
                return OtpLogin(
                    success=True,
                    errors=None,
                    redirect_url=f"/users/{user.get_username()}/",
                    token=token,
                )
            return OtpLogin(
                success=False,
                errors="کد وارد شده صحیح نمیباشد",
                redirect_url="/auth/otp-login/",
                token=None,
            )
        except Exception as e:
            print(e)
            return OtpLogin(
                success=False,
                errors="خطایی رخ داده است",
                redirect_url="/auth/otp-login/",
                token=None,
            )


class Logout(graphene.Mutation):
    success = graphene.Boolean()
    redirect_url = graphene.String()

    @staticmethod
    @login_required
    def mutate(self, info):
        try:
            token = info.context.headers.get("Authorization")
            BurnedTokens.objects.create(token=token)
            return Logout(success=True, redirect_url="/")
        except Exception as e:
            print(e)
            return Logout(success=False, redirect_url="/")


# ========================Auth End========================


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_business = CreateBusiness.Field()
    create_address = CreateAddress.Field()
    update_user = UpdateUser.Field()
    update_address = UpdateAddress.Field()
    delete_address = DeleteAddress.Field()
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
