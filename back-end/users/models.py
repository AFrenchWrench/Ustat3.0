from django.db import models
from django.contrib.auth.models import AbstractUser
from image_optimizer.fields import OptimizedImageField

CITY_CHOICE_FIELD = IRANIAN_CITIES = [
    ("Tehran", "تهران"),
    ("Mashhad", "مشهد"),
    ("Isfahan", "اصفهان"),
    ("Karaj", "کرج"),
    ("Shiraz", "شیراز"),
    ("Tabriz", "تبریز"),
    ("Qom", "قم"),
    ("Ahvaz", "اهواز"),
    ("Kermanshah", "کرمانشاه"),
    ("Urmia", "ارومیه"),
    ("Rasht", "رشت"),
    ("Zahedan", "زاهدان"),
    ("Hamadan", "همدان"),
    ("Kerman", "کرمان"),
    ("Yazd", "یزد"),
    ("Arak", "اراک"),
    ("Ardabil", "اردبیل"),
    ("Bandar Abbas", "بندرعباس"),
    ("Sanandaj", "سنندج"),
    ("Qazvin", "قزوین"),
    ("Zanjan", "زنجان"),
    ("Khorramabad", "خرم‌آباد"),
    ("Eslamshahr", "اسلامشهر"),
    ("Dezful", "دزفول"),
    ("Najafabad", "نجف‌آباد"),
    ("Sabzevar", "سبزوار"),
    ("Neyshabur", "نیشابور"),
    ("Saveh", "ساوه"),
    ("Bushehr", "بوشهر"),
    ("Quchan", "قوچان"),
    ("Bojnurd", "بجنورد"),
    ("Birjand", "بیرجند"),
    ("Torbat-e Heydarieh", "تربت حیدریه"),
    ("Sari", "ساری"),
    ("Gorgan", "گرگان"),
    ("Bandar-e Anzali", "بندر انزلی"),
]


class User(AbstractUser):
    username = models.CharField(max_length=32, unique=True)
    first_name = models.CharField(max_length=32)
    last_name = models.CharField(max_length=32)
    phone_number = models.CharField(max_length=13, unique=True)
    landline_number = models.CharField(max_length=13, unique=True)
    email = models.EmailField(unique=True)
    profile_image = OptimizedImageField(upload_to="profiles/", null=True, blank=True)
    city = models.CharField(max_length=32, choices=CITY_CHOICE_FIELD)
    is_staff = models.BooleanField(default=False)
    position = models.CharField(max_length=32, null=True, blank=True)
    date_joined = models.DateField(auto_now_add=True)
    birth_date = models.DateField()

    def __str__(self):
        return self.username


class Business(models.Model):
    user = models.OneToOneField("User", on_delete=models.CASCADE)
    name = models.CharField(max_length=32, unique=True)
    owner_first_name = models.CharField(max_length=32)
    owner_last_name = models.CharField(max_length=32)
    owner_phone_number = models.CharField(max_length=13, unique=True)
    address = models.TextField()
    is_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Driver(models.Model):
    first_name = models.CharField(max_length=32)
    last_name = models.CharField(max_length=32)
    phone_number = models.CharField(max_length=13, unique=True)
    national_code = models.CharField(max_length=10, unique=True)
    plate_number = models.CharField(max_length=8, unique=True)
    car_model = models.CharField(max_length=16)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
