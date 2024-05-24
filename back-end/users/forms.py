import re

from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import (
    RegexValidator,
    EmailValidator,
)
from users.models import User
from utils.validation_utils import is_persian_string
import datetime


class UserSignUpForm(forms.ModelForm):

    position = forms.CharField(required=False)

    email = forms.CharField(required=True)

    def __init__(self, *args, **kwargs):
        super(UserSignUpForm, self).__init__(*args, **kwargs)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "city",
            "birth_date",
            "phone_number",
            "landline_number",
            "position",
        ]

    def clean_username(self):
        username = self.cleaned_data.get("username")
        pattern = "^[a-zA-Z][a-zA-Z0-9_]{4,20}$"
        if not re.match(pattern, username):
            raise ValidationError("نام کاربری معتبر نمیباشد")

        if User.objects.filter(username=username).exists():
            raise ValidationError("نام کاربری وارد شده در سیستم وجود دارد")

        return username

    def clean_password(self):
        password = self.cleaned_data.get("password")

        if len(password) < 8:
            raise ValidationError("گذرواژه باید حداقل 8 کاراکتر باشد.")

        if not re.search(r"[A-Z]", password):
            raise ValidationError("گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد.")

        if not re.search(r"[0-9]", password):
            raise ValidationError("گذرواژه باید حداقل شامل یک عدد باشد.")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد.")

        return password

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

    # def clean_address(self):
    #     address = self.cleaned_data.get("address")
    #     pattern = r"^[\u0600-\u06FF0-9\s,]+$"
    #     if not re.fullmatch(pattern, address):
    #         raise ValidationError(
    #             "در آدرس تنها از حروف فارسی، اغداد انگلیسی، و ویرگول و یا قاصله استفاده کنید"
    #         )
    #     return address

    def clean_birthdate(self):
        birthdate = self.cleaned_data.get("birthdate")
        if birthdate >= datetime.date.today():
            raise ValidationError("تاریخ تولد باید گذشته باشد")
        elif birthdate > (
            datetime.date.today() - datetime.timedelta(days=(365.25 * 18))
        ):
            raise ValidationError("شما حداقل باید 18 سال سن داشته باشید")
        return birthdate

    def clean_city(self):
        city = self.cleaned_data.get("city")
        if not is_persian_string(city):
            raise ValidationError("لطفا نام شهر خود را فارسی وارد کنید")
        return city

    # def clean_description(self):
    #     description = self.cleaned_data.get("description")
    #     pattern = r"^[\u0600-\u06FF0-9\s,]+$"
    #     if not re.fullmatch(pattern, description):
    #         raise ValidationError(
    #             "در توضیحات تنها از حروف فارسی، اغداد انگلیسی، و ویرگول و یا قاصله استفاده کنید"
    #         )
    #     return description

    def clean_position(self):
        position = self.cleaned_data.get("position")
        if not is_persian_string(position):
            raise ValidationError("سمت شغلی خود را فارسی وارد کنید")
        return position

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

    # def clean_national_code(self):
    #     national_code = self.cleaned_data.get("national_code")
    #     if national_code:
    #         regex_validator = RegexValidator(regex=r"^\d{10}$")
    #         try:
    #             regex_validator(national_code)
    #         except ValidationError:
    #             raise ValidationError("کد ملی وارد شده معتبر نمی‌باشد")

    #         if User.objects.filter(national_code=national_code).exists():
    #             raise ValidationError("کد ملی وارد شده در سیستم وجود دارد")
    #     return national_code
