# backend/eis_apps/authentication/migrations/0009_user_deleted_status.py
# Adds STATUS_DELETED to User.status choices and deleted_at timestamp.
# "Deleting" a user now sets status=DELETED + deleted_at instead of hard-deleting.

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0008_rolepermission_can_download_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('ACTIVE',    'Active'),
                    ('INACTIVE',  'Inactive'),
                    ('SUSPENDED', 'Suspended'),
                    ('DELETED',   'Deleted'),   # ← soft-deleted, hidden from UI
                ],
                default='ACTIVE',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='deleted_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='deleted_by',
            field=models.CharField(max_length=150, blank=True),  # stores username of admin who deleted
        ),
        migrations.AddField(
            model_name='user',
            name='deleted_reason',
            field=models.TextField(blank=True),
        ),
    ]