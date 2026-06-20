from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.Usuarios.permisos.models import Permiso
from apps.Usuarios.roles.models import Rol, RolPermiso, UsuarioRol
from apps.Usuarios.users.models import Usuario


class MePermissionsEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _mk_user(self, username, tipo_usuario="ADMINISTRATIVO"):
        return Usuario.objects.create_user(
            username=username,
            email=f"{username}@mail.com",
            password="Abcd1234",
            nombres="Test",
            apellidos="User",
            tipo_usuario=tipo_usuario,
            estado="ACTIVO",
        )

    def test_requires_authentication(self):
        res = self.client.get("/api/auth/permissions")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_empty_when_user_has_no_roles(self):
        user = self._mk_user("no.roles")
        self.client.force_authenticate(user=user)

        res = self.client.get("/api/auth/permissions")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["permissions"], [])
        self.assertEqual(res.data["roles"], [])

    def test_returns_role_names_and_unique_sorted_permissions(self):
        user = self._mk_user("role.user")

        rol_a = Rol.objects.create(nombre="Recepcion")
        rol_b = Rol.objects.create(nombre="Medico")

        p1 = Permiso.objects.create(codigo="CITAS.CREAR", nombre="Crear cita", modulo="citas")
        p2 = Permiso.objects.create(codigo="citas.reprogramar", nombre="Reprogramar cita", modulo="citas")

        RolPermiso.objects.create(id_rol=rol_a, id_permiso=p1)
        RolPermiso.objects.create(id_rol=rol_a, id_permiso=p2)
        RolPermiso.objects.create(id_rol=rol_b, id_permiso=p1)

        UsuarioRol.objects.create(id_usuario=user, id_rol=rol_a)
        UsuarioRol.objects.create(id_usuario=user, id_rol=rol_b)

        self.client.force_authenticate(user=user)
        res = self.client.get("/api/auth/permissions")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["roles"], ["Medico", "Recepcion"])
        self.assertEqual(res.data["permissions"], ["citas.crear", "citas.reprogramar"])
