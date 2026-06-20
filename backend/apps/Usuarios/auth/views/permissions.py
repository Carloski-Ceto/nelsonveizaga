"""GET /api/auth/permissions/ — permisos efectivos de la sesión actual."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.Usuarios.roles.models import UsuarioRol


class MePermissionsView(APIView):
    """
    Devuelve permisos efectivos (códigos) de la sesión actual.

    Respuesta:
    {
      "permissions": ["modulo.accion", ...],
      "roles": ["Rol A", "Rol B", ...]
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_roles = (
            UsuarioRol.objects
            .filter(id_usuario=request.user)
            .select_related('id_rol')
            .prefetch_related('id_rol__rol_permisos__id_permiso')
        )

        role_names = []
        permission_codes = set()

        for user_role in user_roles:
            role = user_role.id_rol
            role_names.append(role.nombre)
            for rp in role.rol_permisos.all():
                code = (rp.id_permiso.codigo or '').strip().lower()
                if code:
                    permission_codes.add(code)

        return Response({
            'permissions': sorted(permission_codes),
            'roles': sorted(set(role_names)),
        })
