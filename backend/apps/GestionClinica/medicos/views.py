from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Medico
from .serializers import MedicoSerializer


class MedicoViewSet(viewsets.ModelViewSet):
    queryset = Medico.objects.select_related('id_usuario').all()
    serializer_class = MedicoSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['id_usuario__nombres', 'id_usuario__apellidos', 'matricula']
    ordering_fields = ['id_usuario__apellidos', 'anios_experiencia', 'fecha_creacion']
    ordering = ['id_usuario__apellidos']

    def perform_create(self, serializer):
        medico = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='medicos',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró médico {medico.matricula}',
            tabla_afectada='medicos',
            id_registro_afectado=medico.id_medico,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        medico = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='medicos',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó médico {medico.matricula}',
            tabla_afectada='medicos',
            id_registro_afectado=medico.id_medico,
            ip_origen=get_client_ip(self.request),
        )

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'error': 'No se puede eliminar el médico porque tiene referencias clínicas asociadas. Puedes desactivarlo en su lugar.'},
                status=status.HTTP_409_CONFLICT,
            )
