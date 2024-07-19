import re


def is_persian_string(s):
    pattern = r"^[\u0600-\u06FF\s]+$"
    if re.fullmatch(pattern, s):
        return True
    else:
        return False


from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import imghdr


def validate_image_file_type(file):
    valid_mime_types = ["image/jpeg", "image/png"]
    valid_extensions = ["jpg", "jpeg", "png"]

    # Check file extension
    file_extension = file.name.split(".")[-1].lower()
    if file_extension not in valid_extensions:
        raise ValidationError(_("فرمت فایل نامعتبر است"))

    # Check MIME type
    if file.content_type not in valid_mime_types:
        raise ValidationError(_("نوع فایل نامعتبر است"))

    # Check file header (signature)
    file.seek(0)
    file_type = imghdr.what(file)
    file.seek(0)
    if file_type not in valid_extensions:
        raise ValidationError(_("نوع فایل نامعتبر است"))
