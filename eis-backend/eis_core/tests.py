from django.test import TestCase
from django.db import models
from django.contrib.auth import get_user_model
from eis_core.models import SoftDeleteModel

User = get_user_model()

class DummySoftModel(SoftDeleteModel):
    name = models.CharField(max_length=100)
    class Meta:
        app_label = 'eis_core'

class EisCoreTests(TestCase):
    def test_soft_delete_model_defaults(self):
        instance = DummySoftModel(name="test")
        self.assertTrue(instance.is_active)
        self.assertIsNone(instance.deactivated_at)

