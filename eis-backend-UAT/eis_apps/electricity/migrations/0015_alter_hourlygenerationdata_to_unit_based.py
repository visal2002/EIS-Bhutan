from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('electricity', '0014_remove_plantgenerationdaily_ingest_version_and_more'),
        ('master_data', '0006_alter_generationplant_options_and_more'),
    ]

    operations = [
        # 1. Remove all old generation/export columns
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_bhp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_chp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='export_chp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_khp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='export_khp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_thp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='export_thp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_mhp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='export_mhp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_dhp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='export_dhp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='generation_nhp'),
        migrations.RemoveField(model_name='hourlygenerationdata', name='export_nhp'),

        # 2. Add plant FK
        migrations.AddField(
            model_name='hourlygenerationdata',
            name='plant',
            field=models.ForeignKey(
                null=True,  # temporarily nullable so existing rows don't fail
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='hourly_records',
                to='master_data.generationplant',
            ),
        ),

        # 3. Add unit columns
        migrations.AddField(
            model_name='hourlygenerationdata',
            name='unit1_mw',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='hourlygenerationdata',
            name='unit2_mw',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='hourlygenerationdata',
            name='unit3_mw',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='hourlygenerationdata',
            name='unit4_mw',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=20, null=True),
        ),

        # 4. Update Meta ordering & unique_together
        migrations.AlterModelOptions(
            name='hourlygenerationdata',
            options={'ordering': ['-date', '-hour', 'plant']},
        ),
        migrations.AlterUniqueTogether(
            name='hourlygenerationdata',
            unique_together={('plant', 'date', 'hour')},
        ),
    ]
