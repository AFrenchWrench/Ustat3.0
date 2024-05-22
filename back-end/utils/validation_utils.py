import re


def is_persian_string(s):
    pattern = r"^[\u0600-\u06FF\s]+$"
    if re.fullmatch(pattern, s):
        return True
    else:
        return False
