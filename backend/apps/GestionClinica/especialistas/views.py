from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdminWriteClinicoRead
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Especialista
from .serializers import EspecialistaSerializer


class EspecialistaViewSet(viewsets.ModelViewSet):
    queryset = Especialista.objects.select_related('id_medico__id_usuario').all()
    serializer_class = EspecialistaSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdminWriteClinicoRead]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'especialidad']
    search_fields = ['id_medico__id_usuario__nombres', 'id_medico__id_usuario__apellidos', 'registro_profesional', 'especialidad']
    ordering_fields = ['id_medico__id_usuario__apellidos', 'especialidad', 'fecha_creacion']
    ordering = ['id_medico__id_usuario__apellidos']

    def perform_create(self, serializer):
        especialista = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='especialistas',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró especialista {especialista.registro_profesional}',
            tabla_afectada='especialistas',
            id_registro_afectado=especialista.id_especialista,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        especialista = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='especialistas',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó especialista {especialista.registro_profesional}',
            tabla_afectada='especialistas',
            id_registro_afectado=especialista.id_especialista,
            ip_origen=get_client_ip(self.request),
        )

    def destroy(self, request, *args, **kwargs):
        especialista = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    'error': (
                        'No se puede eliminar el especialista porque tiene historial clínico '
                        '(citas o consultas) asociado. Puedes desactivarlo en su lugar.'
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
