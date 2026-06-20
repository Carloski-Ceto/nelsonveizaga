from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_login_lockout_security'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tokenrecuperacion',
            name='token',
            field=models.TextField(db_index=True),
        ),
    ]
