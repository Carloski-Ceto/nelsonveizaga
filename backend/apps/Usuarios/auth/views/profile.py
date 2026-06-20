"""GET/PATCH /api/auth/me/ — perfil de la sesión actual."""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora

from ..serializers import PerfilSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/  — Ver perfil propio
    PATCH /api/auth/me/  — Editar perfil propio
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PerfilSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='auth', accion=AccionBitacora.EDITAR,
            descripcion=f'Perfil actualizado: {self.request.user.username}',
            tabla_afectada='usuarios', id_registro_afectado=self.request.user.id,
            ip_origen=get_client_ip(self.request),
        )
