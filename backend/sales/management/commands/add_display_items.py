import os
import random
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from sales.models import DisplayItem, ItemVariant

# Path to the random_pics directory relative to the project root
RANDOM_PICS_PATH = os.path.join(settings.BASE_DIR, "random_pics")

# Get all image files in the random_pics directory
image_files = [
    f
    for f in os.listdir(RANDOM_PICS_PATH)
    if f.lower().endswith((".png", ".jpg", ".jpeg"))
]


def get_random_image():
    """Returns the path of a random image from the random_pics directory."""
    return os.path.join(RANDOM_PICS_PATH, random.choice(image_files))


def get_file_content(file_path):
    """Returns a Django ContentFile object from the given file path."""
    with open(file_path, "rb") as file:
        return ContentFile(file.read(), name=os.path.basename(file_path))


ITEM_TYPE_CHOICES = [
    ("s", "مبل"),
    ("b", "سرویس خواب"),
    ("m", "میز و صندلی"),
    ("j", "جلومبلی و عسلی"),
    ("c", "آینه کنسول"),
]


# Persian string generator for testing purposes
def generate_persian_string(length=10):
    persian_chars = "ابپتثجچحخدذرزسشصضطظعغفقکگلمنوهی"
    return "".join(random.choice(persian_chars) for _ in range(length))


# Sample dimensions generator based on item type
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


class Command(BaseCommand):
    help = "Seeds the database with DisplayItems and ItemVariants"

    def handle(self, *args, **kwargs):
        for item_type, item_type_name in ITEM_TYPE_CHOICES:
            for i in range(10):
                display_item_name = f"{generate_persian_string()}_{i}"
                display_item = DisplayItem.objects.create(
                    type=item_type, name=display_item_name
                )

                for j in range(5):
                    variant_name = f"{display_item_name}_variant_{j}"
                    dimensions = generate_dimensions(item_type)
                    price = random.randint(
                        1000000, 10000000
                    )  # Random price between 1,000,000 and 10,000,000
                    description = generate_persian_string(
                        50
                    )  # Random Persian description
                    fabric = generate_persian_string()
                    color = generate_persian_string()
                    wood_color = generate_persian_string()

                    # Get random image file paths
                    thumbnail_image_path = get_random_image()
                    slider1_image_path = get_random_image()
                    slider2_image_path = get_random_image()
                    slider3_image_path = get_random_image()

                    # Create Django ContentFile objects
                    thumbnail_content = get_file_content(thumbnail_image_path)
                    slider1_content = get_file_content(slider1_image_path)
                    slider2_content = get_file_content(slider2_image_path)
                    slider3_content = get_file_content(slider3_image_path)

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

        self.stdout.write(
            self.style.SUCCESS("Successfully seeded DisplayItems and ItemVariants")
        )
