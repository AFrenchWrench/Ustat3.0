# Generated by Django 4.2.10 on 2024-08-21 07:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='rank',
            field=models.CharField(choices=[('a', 'A'), ('b', 'B'), ('c', 'C')], default='c', max_length=1),
        ),
    ]
