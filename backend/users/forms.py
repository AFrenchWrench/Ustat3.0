from dataclasses import field
import re
from hmac import compare_digest

from django import forms
from django.contrib.auth.forms import (
    UserCreationForm,
)
from django.core.exceptions import ValidationError
from django.core.validators import (
    RegexValidator,
    EmailValidator,
)
from users.models import (
    Business,
    User,
)
from main.models import Cities
from utils.validation_utils import is_persian_string
import datetime


class UserSignUpForm(UserCreationForm):

    def __init__(self, *args, **kwargs):
        super(UserSignUpForm, self).__init__(*args, **kwargs)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password1",
            "password2",
            "birthdate",
            "phone_number",
            "landline_number",
        ]

    def clean_username(self):
        username = self.cleaned_data.get("username")
        pattern = "^[a-zA-Z][a-zA-Z0-9_]{4,20}$"
        if not re.match(pattern, username):
            raise ValidationError("نام کاربری معتبر نمیباشد")

        if User.objects.filter(username=username).exists():
            raise ValidationError("نام کاربری وارد شده در سیستم وجود دارد")

        return username

    def clean_password1(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.data.get("password2")

        if not compare_digest(password1, password2):
            raise ValidationError("گذرواژه ها یکسان نیستند")

        if len(password1) < 8:
            raise ValidationError("گذرواژه باید حداقل 8 کاراکتر باشد.")

        if not re.search(r"[A-Z]", password1):
            raise ValidationError("گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد.")

        if not re.search(r"[0-9]", password1):
            raise ValidationError("گذرواژه باید حداقل شامل یک عدد باشد.")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>_]', password1):
            raise ValidationError("گذرواژه باید حداقل شامل یک کاراکتر خاص باشد.")

        return password1

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if not is_persian_string(first_name):
            raise ValidationError("نام شما باید فارسی باشد")
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if not is_persian_string(last_name):
            raise ValidationError("نام خانوادگی شما باید فارسی باشد")
        return last_name

    def clean_birthdate(self):
        birthdate = self.cleaned_data.get("birthdate")
        if birthdate >= datetime.date.today():
            raise ValidationError("تاریخ تولد باید گذشته باشد")
        elif birthdate > (
            datetime.date.today() - datetime.timedelta(days=(365.25 * 18))
        ):
            raise ValidationError("شما حداقل باید 18 سال سن داشته باشید")

        return birthdate

    def clean_email(self):
        email = self.cleaned_data.get("email")
        email_validator = EmailValidator(message="ایمیل وارد شده معتبر نمی‌باشد")
        if email:
            try:
                email_validator(email)
            except ValidationError:
                raise ValidationError(message="ایمیل وارد شده معتبر نمی‌باشد")

            if User.objects.filter(email=email).exists():
                raise ValidationError("ایمیل وارد شده در سیستم وجود دارد")

        return email

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get("phone_number")
        if phone_number:
            regex_validator = RegexValidator(regex=r"^\+\d{9,15}$")
            try:
                regex_validator(phone_number)
            except ValidationError:
                raise ValidationError(
                    "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
                )

            if User.objects.filter(phone_number=phone_number).exists():
                raise ValidationError("شماره تلفن وارد شده در سیستم وجود دارد")

        return phone_number

    def clean_landline_number(self):
        landline_number = self.cleaned_data.get("landline_number")
        if landline_number:
            regex_validator = RegexValidator(regex=r"^\+\d{9,15}$")
            try:
                regex_validator(landline_number)
            except ValidationError:
                raise ValidationError(
                    "شماره ثابت وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
                )

            if User.objects.filter(landline_number=landline_number).exists():
                raise ValidationError("شماره ثابت وارد شده در سیستم وجود دارد")
        return landline_number

    def save(self, commit=True):
        user = super().save(commit=False)
        city_name = self.data.get("city")
        try:
            user.city = Cities.objects.get(name=city_name)
        except Cities.DoesNotExist:
            raise forms.ValidationError(f"City named '{city_name}' does not exist.")

        if commit:
            user.save()
        return user


class BusinessSignUpForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        super(BusinessSignUpForm, self).__init__(*args, **kwargs)

    class Meta:
        model = Business
        fields = [
            "name",
            "owner_first_name",
            "owner_last_name",
            "owner_phone_number",
            "address",
        ]

    def clean_name(self):
        name = self.cleaned_data.get("name")
        if not is_persian_string(name):
            raise ValidationError("نام شرکت باید فارسی باشد")
        return name

    def clean_owner_first_name(self):
        owner_first_name = self.cleaned_data.get("owner_first_name")
        if not is_persian_string(owner_first_name):
            raise ValidationError("نام صاحب شرکت باید فارسی باشد")
        return owner_first_name

    def clean_owner_last_name(self):
        owner_last_name = self.cleaned_data.get("owner_last_name")
        if not is_persian_string(owner_last_name):
            raise ValidationError("نام خانوادگی صاحب شرکت باید فارسی باشد")
        return owner_last_name

    def clean_owner_phone_number(self):
        owner_phone_number = self.cleaned_data.get("owner_phone_number")
        if owner_phone_number:
            regex_validator = RegexValidator(regex=r"^\+\d{9,15}$")
            try:
                regex_validator(owner_phone_number)
            except ValidationError:
                raise ValidationError(
                    "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
                )

            if Business.objects.filter(owner_phone_number=owner_phone_number).exists():
                raise ValidationError("شماره تلفن وارد شده در سیستم وجود دارد")

        return owner_phone_number

    def clean_address(self):
        address = self.cleaned_data.get("address")
        pattern = r"^[\u0600-\u06FF0-9\s,]+$"
        if not re.fullmatch(pattern, address):
            raise ValidationError(
                "در آدرس تنها از حروف فارسی، اغداد انگلیسی، و ویرگول و یا قاصله استفاده کنید"
            )
        return address

    def save(self, user=None, commit=True):
        business = super(BusinessSignUpForm, self).save(commit=False)
        if user:
            business.user = user
        if commit:
            business.save()
        return business


class UserUpdateForm(UserSignUpForm):
    def __init__(self, *args, **kwargs):
        super(UserUpdateForm, self).__init__(*args, **kwargs)
        for field_name in self.fields:
            self.fields[field_name].required = False

    def clean_username(self):
        if self.data.get("username"):
            username = self.cleaned_data.get("username")
            pattern = "^[a-zA-Z][a-zA-Z0-9_]{4,20}$"
            if not re.match(pattern, username):
                raise ValidationError("نام کاربری معتبر نمیباشد")

            if User.objects.filter(username=username).exists():
                raise ValidationError("نام کاربری وارد شده در سیستم وجود دارد")

            return username

    def clean_password1(self):
        if self.data.get("password1") and self.data.get("password2"):
            password1 = self.cleaned_data.get("password1")
            password2 = self.data.get("password2")

            if not compare_digest(password1, password2):
                raise ValidationError("گذرواژه ها یکسان نیستند")

            if len(password1) < 8:
                raise ValidationError("گذرواژه باید حداقل 8 کاراکتر باشد.")

            if not re.search(r"[A-Z]", password1):
                raise ValidationError(
                    "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد."
                )

            if not re.search(r"[0-9]", password1):
                raise ValidationError("گذرواژه باید حداقل شامل یک عدد باشد.")

            if not re.search(r'[!@#$%^&*(),.?":{}|<>_]', password1):
                raise ValidationError("گذرواژه باید حداقل شامل یک کاراکتر خاص باشد.")

            return password1
        elif (self.data.get("password1") and not self.data.get("password2")) or (
            not self.data.get("password1") and self.data.get("password2")
        ):
            raise ValidationError("رمز عبور و تکرار رمز عبور باید وارد شود")

    def clean_first_name(self):
        if self.data.get("first_name"):
            first_name = self.cleaned_data.get("first_name")
            if not is_persian_string(first_name):
                raise ValidationError("نام شما باید فارسی باشد")
            return first_name

    def clean_last_name(self):
        if self.data.get("last_name"):
            last_name = self.cleaned_data.get("last_name")
            if not is_persian_string(last_name):
                raise ValidationError("نام خانوادگی شما باید فارسی باشد")
            return last_name

    def clean_birthdate(self):
        if self.data.get("birthdate"):
            birthdate = self.cleaned_data.get("birthdate")
            if birthdate >= datetime.date.today():
                raise ValidationError("تاریخ تولد باید گذشته باشد")
            elif birthdate > (
                datetime.date.today() - datetime.timedelta(days=(365.25 * 18))
            ):
                raise ValidationError("شما حداقل باید 18 سال سن داشته باشید")

            return birthdate

    def clean_email(self):
        if self.data.get("email"):
            email = self.cleaned_data.get("email")
            email_validator = EmailValidator(message="ایمیل وارد شده معتبر نمی‌باشد")
            if email:
                try:
                    email_validator(email)
                except ValidationError:
                    raise ValidationError(message="ایمیل وارد شده معتبر نمی‌باشد")

                if User.objects.filter(email=email).exists():
                    raise ValidationError("ایمیل وارد شده در سیستم وجود دارد")

            return email

    def clean_phone_number(self):
        if self.data.get("phone_number"):
            phone_number = self.cleaned_data.get("phone_number")
            if phone_number:
                regex_validator = RegexValidator(regex=r"^\+\d{9,15}$")
                try:
                    regex_validator(phone_number)
                except ValidationError:
                    raise ValidationError(
                        "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
                    )

                if User.objects.filter(phone_number=phone_number).exists():
                    raise ValidationError("شماره تلفن وارد شده در سیستم وجود دارد")

            return phone_number

    def clean_landline_number(self):
        if self.data.get("landline_number"):
            landline_number = self.cleaned_data.get("landline_number")
            if landline_number:
                regex_validator = RegexValidator(regex=r"^\+\d{9,15}$")
                try:
                    regex_validator(landline_number)
                except ValidationError:
                    raise ValidationError(
                        "شماره ثابت وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
                    )

                if User.objects.filter(landline_number=landline_number).exists():
                    raise ValidationError("شماره ثابت وارد شده در سیستم وجود دارد")
            return landline_number

    def save(self, commit=True):
        user = self.instance  # Get the user instance being updated
        email_changed = False

        for field_name in self.fields:
            if field_name in self.data and self.cleaned_data[field_name] is not None:
                if (
                    field_name == "email"
                    and getattr(user, field_name) != self.cleaned_data[field_name]
                ):
                    email_changed = True

            if field_name == "password1":
                user.set_password(self.cleaned_data[field_name])
            else:
                setattr(user, field_name, self.cleaned_data[field_name])

        # Set is_fully_authenticated to False if email is changed
        if email_changed:
            user.is_fully_authenticated = False

        city_name = self.data.get("city")
        if city_name:
            try:
                user.city = Cities.objects.get(name=city_name)
            except Cities.DoesNotExist:
                raise forms.ValidationError(f"City named '{city_name}' does not exist.")

        if commit:
            user.save()
        return user


class BusinessUpdateForm(BusinessSignUpForm):
    def __init__(self, *args, **kwargs):
        super(BusinessUpdateForm, self).__init__(*args, **kwargs)
        for field_name in self.fields:
            self.fields[field_name].required = False

    def clean_name(self):
        if self.data.get("name"):
            name = self.cleaned_data.get("name")
            if not is_persian_string(name):
                raise ValidationError("نام شرکت باید فارسی باشد")
            return name

    def clean_owner_first_name(self):
        if self.data.get("owner_first_name"):
            owner_first_name = self.cleaned_data.get("owner_first_name")
            if not is_persian_string(owner_first_name):
                raise ValidationError("نام صاحب شرکت باید فارسی باشد")
            return owner_first_name

    def clean_owner_last_name(self):
        if self.data.get("owner_last_name"):
            owner_last_name = self.cleaned_data.get("owner_last_name")
            if not is_persian_string(owner_last_name):
                raise ValidationError("نام خانوادگی صاحب شرکت باید فارسی باشد")
            return owner_last_name

    def clean_owner_phone_number(self):
        if self.data.get("owner_phone_number"):
            owner_phone_number = self.cleaned_data.get("owner_phone_number")
            if owner_phone_number:
                regex_validator = RegexValidator(regex=r"^\+\d{9,15}$")
                try:
                    regex_validator(owner_phone_number)
                except ValidationError:
                    raise ValidationError(
                        "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
                    )

                if Business.objects.filter(
                    owner_phone_number=owner_phone_number
                ).exists():
                    raise ValidationError("شماره تلفن وارد شده در سیستم وجود دارد")

            return owner_phone_number

    def clean_address(self):
        if self.data.get("address"):
            address = self.cleaned_data.get("address")
            pattern = r"^[\u0600-\u06FF0-9\s,]+$"
            if not re.fullmatch(pattern, address):
                raise ValidationError(
                    "در آدرس تنها از حروف فارسی، اغداد انگلیسی، و ویرگول و یا قاصله استفاده کنید"
                )
            return address

    def save(self, commit=True):
        business = self.instance  # Get the business instance being updated

        for field_name in self.fields:
            if field_name in self.data and self.cleaned_data[field_name] is not None:
                setattr(business, field_name, self.cleaned_data[field_name])

        # Set is_confirmed to False on update
        business.is_confirmed = False

        if commit:
            business.save()
        return business
