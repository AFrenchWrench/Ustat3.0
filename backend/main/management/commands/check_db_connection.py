import sys
from django.core.management import call_command
from django.db import connections
from django.db.utils import OperationalError


def check_db_connection():
    try:
        # Check if the default database is available
        connection = connections["default"]
        connection.cursor()
        print("Database is available.")
        return 0
    except OperationalError as e:
        # Database is not available or there is an issue
        print("Database is not available.")
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(check_db_connection())
