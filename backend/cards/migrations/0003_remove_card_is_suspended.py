from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("cards", "0002_card_due_at_default"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="card",
            name="is_suspended",
        ),
    ]
