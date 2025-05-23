# Generated by Django 4.2.10 on 2024-08-26 18:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_business_rank'),
    ]

    operations = [
        migrations.AlterField(
            model_name='business',
            name='owner_phone_number',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='user',
            name='landline_number',
            field=models.CharField(max_length=20, unique=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(max_length=20, unique=True),
        ),
    ]
