# utils.py
import random
import string
import redis
from datetime import datetime, timedelta

r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)


def generate_verification_code(user_email):
    code = "".join(random.choices(string.digits, k=6))
    expiry_time = datetime.now() + timedelta(minutes=5)  # Code is valid for 5 minutes
    r.set(f"verification_code_{user_email}", code)
    r.expireat(f"verification_code_{user_email}", expiry_time)

    return code
