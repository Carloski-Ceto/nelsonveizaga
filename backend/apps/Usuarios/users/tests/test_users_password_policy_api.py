from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.Usuarios.users.models import Usuario


class UsersCreatePasswordPolicyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(
            username="admin.api",
            email="admin.api@mail.com",
            password="R4ndomXa",
            nombres="Admin",
            apellidos="Api",
            tipo_usuario="ADMIN",
            estado="ACTIVO",
        )
        self.client.force_authenticate(user=self.admin)

    def _payload(self, password):
        return {
            "username": "nuevo.user",
            "email": "nuevo.user@mail.com",
            "password": password,
            "nombres": "Nuevo",
            "apellidos": "Usuario",
            "tipo_usuario": "ADMINISTRATIVO",
            "estado": "ACTIVO",
            "is_staff": False,
        }

    def test_rejects_password_with_symbol(self):
        res = self.client.post("/api/users", self._payload("Abcd1234!"), format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.data)

    def test_accepts_valid_password(self):
        res = self.client.post("/api/users", self._payload("R4ndomXa"), format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
