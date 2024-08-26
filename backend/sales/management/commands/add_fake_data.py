import os
import random
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.conf import settings
from faker import Faker
from main.models import Provinces, Cities
from users.models import (
    User,
    Business,
    Address,
)
from sales.models import (
    DisplayItem,
    ItemVariant,
    Order,
    OrderItem,
    OrderTransaction,
)
from main.management.commands.add_cities import provinces, cities


# Initialize Faker
fake = Faker("fa_IR")

# Paths and Constants
RANDOM_PICS_PATH = os.path.join(settings.BASE_DIR, "random_pics")
image_files = [
    f
    for f in os.listdir(RANDOM_PICS_PATH)
    if f.lower().endswith((".png", ".jpg", ".jpeg"))
]

ITEM_TYPE_CHOICES = [
    "s",
    "b",
    "m",
    "j",
    "c",
]

ORDER_STATUSES = [
    "ps",
    "p",
    "a",
    "pp",
    "pd",
    "ps",
    "s",
    "de",
    "d",
    "c",
]

PROVINCES = [province["name"] for province in provinces]
CITIES = [city["name"] for city in cities]


# Helper Functions
def generate_persian_string(length=10):
    persian_chars = "ابپتثجچحخدذرزسشصضطظعغفقکگلمنوهی"
    return "".join(random.choice(persian_chars) for _ in range(length))


def get_random_image():
    return os.path.join(RANDOM_PICS_PATH, random.choice(image_files))


def get_file_content(file_path):
    with open(file_path, "rb") as file:
        return ContentFile(file.read(), name=os.path.basename(file_path))


def generate_dimensions(display_item_type):
    dimensions = {
        "length": random.randint(100, 200),
        "width": random.randint(50, 150),
        "height": random.randint(50, 150),
    }

    if display_item_type == "b":  # سرویس خواب
        dimensions["makeup table"] = dimensions.copy()
        dimensions["night stand"] = {"quantity": 2, **dimensions.copy()}
        dimensions["mirror"] = dimensions.copy()

    if display_item_type == "m":  # میز و صندلی
        dimensions["chair"] = {"quantity": 4, **dimensions.copy()}

    if display_item_type == "j":  # جلومبلی و عسلی
        dimensions["side table"] = {"quantity": 2, **dimensions.copy()}

    if display_item_type == "c":  # آینه کنسول
        dimensions["mirror"] = dimensions.copy()

    return dimensions


# Create Users, Businesses, and Addresses
def create_users_and_addresses(num_users=100):
    users = []
    businesses = []

    for _ in range(num_users):
        user = User.objects.create(
            username=fake.user_name(),
            first_name=generate_persian_string(),
            last_name=generate_persian_string(),
            phone_number=fake.phone_number(),
            landline_number=fake.phone_number(),
            email=fake.email(),
            birthdate=fake.date_of_birth(minimum_age=18, maximum_age=80),
        )
        users.append(user)
        if random.choice([True, False]):
            business = Business.objects.create(
                name=generate_persian_string(),
                owner_first_name=user.first_name,
                owner_last_name=user.last_name,
                owner_phone_number=user.phone_number,
                user=user,
            )
            businesses.append(business)

        # Create at least one address per user
        province_name = random.choice(PROVINCES)
        city_name = random.choice(CITIES)

        province = Provinces.objects.get(name=province_name)
        city = Cities.objects.filter(name=city_name).first()

        Address.objects.create(
            user=user,
            title=generate_persian_string(),
            province=province,
            city=city,
            address=fake.address(),
            postal_code=fake.postcode(),
        )

    return users, businesses


# Generate DisplayItems and ItemVariants
def generate_display_items_and_variants():
    for item_type in ITEM_TYPE_CHOICES:
        for i in range(20):
            display_item_name = f"{generate_persian_string()}_{i}"
            display_item = DisplayItem.objects.create(
                type=item_type, name=display_item_name
            )

            for j in range(10):
                variant_name = f"{display_item_name}_variant_{j}"
                dimensions = generate_dimensions(item_type)
                price = random.randint(1000000, 10000000)
                description = generate_persian_string(50)
                fabric = generate_persian_string()
                color = generate_persian_string()
                wood_color = generate_persian_string()

                thumbnail_content = get_file_content(get_random_image())
                slider1_content = get_file_content(get_random_image())
                slider2_content = get_file_content(get_random_image())
                slider3_content = get_file_content(get_random_image())

                ItemVariant.objects.create(
                    display_item=display_item,
                    name=variant_name,
                    dimensions=dimensions,
                    price=price,
                    description=description,
                    fabric=fabric,
                    color=color,
                    wood_color=wood_color,
                    show_in_first_page=bool(random.getrandbits(1)),
                    is_for_business=bool(random.getrandbits(1)),
                    thumbnail=thumbnail_content,
                    slider1=slider1_content,
                    slider2=slider2_content,
                    slider3=slider3_content,
                )


# Create Orders and OrderItems
def create_orders_and_order_items(users):
    item_variants = list(ItemVariant.objects.all())

    for user in users:
        for _ in range(15):
            order = Order.objects.create(
                user=user,
                address=user.addresses.first(),  # assuming each user has at least one address
                status=random.choice(ORDER_STATUSES),
                due_date=fake.date_this_year(),
            )

            num_items = random.randint(1, 5)

            for _ in range(num_items):
                item_variant = random.choice(item_variants)
                random_description = generate_persian_string(50)
                quantity = random.randint(1, 3)

                OrderItem.objects.create(
                    order=order,
                    item_variant=item_variant,
                    name=item_variant.name,
                    dimensions=item_variant.dimensions,
                    fabric=item_variant.fabric,
                    color=item_variant.color,
                    wood_color=item_variant.wood_color,
                    type=item_variant.display_item.type,
                    price=item_variant.price,
                    thumbnail=item_variant.thumbnail,
                    description=random_description,
                    quantity=quantity,
                )

            order.save()


# Create Transactions
def create_transactions_for_orders():
    orders = Order.objects.all()

    for order in orders:
        amount_paid = 0
        if OrderTransaction.objects.filter(order=order).exists():
            for transaction in order.transactions.all():
                amount_paid += transaction.amount

        while amount_paid < order.total_price:
            payment = min(
                order.total_price - amount_paid, random.randint(500000, 5000000)
            )
            amount_paid += payment

            OrderTransaction.objects.create(
                order=order,
                amount=payment,
                due_date=fake.date_this_year(),
                description=generate_persian_string(30),
                is_check=random.choice([True, False]),
            )


# Command Class to Run the Script
class Command(BaseCommand):
    help = "Seeds the database with Users, Businesses, Addresses, DisplayItems, ItemVariants, Orders, OrderItems, and Transactions"

    def handle(self, *args, **kwargs):
        users, businesses = create_users_and_addresses()
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(users)} Users and {len(businesses)} Businesses"
            )
        )

        generate_display_items_and_variants()
        self.stdout.write(self.style.SUCCESS("Created DisplayItems and ItemVariants"))

        create_orders_and_order_items(users)
        self.stdout.write(self.style.SUCCESS("Created Orders and OrderItems"))

        create_transactions_for_orders()
        self.stdout.write(self.style.SUCCESS("Created Transactions for Orders"))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully"))
