# Generated by Django 4.0.5 on 2022-06-20 12:39

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('datacoreapp', '0004_add_custom_user_and_database_models'),
    ]

    operations = [
        migrations.RenameField(
            model_name='bank',
            old_name='databse',
            new_name='database',
        ),
        migrations.RenameField(
            model_name='relation',
            old_name='databse',
            new_name='database',
        ),
        migrations.RenameField(
            model_name='view',
            old_name='databse',
            new_name='database',
        ),
    ]
