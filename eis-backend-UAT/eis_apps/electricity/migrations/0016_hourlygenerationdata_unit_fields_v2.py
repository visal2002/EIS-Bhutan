from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('electricity', '0015_alter_hourlygenerationdata_to_unit_based'),
    ]

    operations = [
        # 1. Rename unit*_mw → unit*
        migrations.RenameField('hourlygenerationdata', 'unit1_mw', 'unit1'),
        migrations.RenameField('hourlygenerationdata', 'unit2_mw', 'unit2'),
        migrations.RenameField('hourlygenerationdata', 'unit3_mw', 'unit3'),
        migrations.RenameField('hourlygenerationdata', 'unit4_mw', 'unit4'),

        # 2. Alter decimal precision from (20,8) → (10,3) for unit1-4
        migrations.AlterField('hourlygenerationdata', 'unit1',
            models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),
        migrations.AlterField('hourlygenerationdata', 'unit2',
            models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),
        migrations.AlterField('hourlygenerationdata', 'unit3',
            models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),
        migrations.AlterField('hourlygenerationdata', 'unit4',
            models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),

        # 3. Add unit5 & unit6
        migrations.AddField('hourlygenerationdata', 'unit5',
            models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),
        migrations.AddField('hourlygenerationdata', 'unit6',
            models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),

        # 4. Add timestamp field
        migrations.AddField('hourlygenerationdata', 'timestamp',
            models.DateTimeField(blank=True, null=True)),

        # 5. Change hour from PositiveSmallIntegerField → CharField(max_length=2)
        migrations.AlterField('hourlygenerationdata', 'hour',
            models.CharField(blank=True, help_text="Hour as 2-digit string, e.g. '01', '23'",
                             max_length=2, null=True)),

        # 6. Make date nullable
        migrations.AlterField('hourlygenerationdata', 'date',
            models.DateField(blank=True, null=True)),

        # 7. Add DB index on (plant, date, hour)
        migrations.AddIndex('hourlygenerationdata',
            models.Index(fields=['plant', 'date', 'hour'],
                         name='elec_hourly_plant_date_hour_idx')),
    ]
