# Generated manually to add default due_at
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("cards", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="card",
            name="due_at",
            field=models.DateTimeField(
                default=django.utils.timezone.now,
                help_text="Next scheduled review time",
            ),
        ),
    ]
