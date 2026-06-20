from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdminCreateMedicoReadClinico
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Paciente
from .serializers import PacienteSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdminCreateMedicoReadClinico]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'sexo']
    search_fields = ['nombres', 'apellidos', 'documento_identidad', 'telefono', 'email']
    ordering_fields = ['apellidos', 'nombres', 'fecha_creacion']
    ordering = ['apellidos', 'nombres']

    def perform_create(self, serializer):
        paciente = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='pacientes',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró paciente {paciente.documento_identidad}',
            tabla_afectada='pacientes',
            id_registro_afectado=paciente.id_paciente,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        paciente = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='pacientes',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó paciente {paciente.documento_identidad}',
            tabla_afectada='pacientes',
            id_registro_afectado=paciente.id_paciente,
            ip_origen=get_client_ip(self.request),
        )

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    'error': (
                        'No se puede eliminar el paciente porque tiene historial clínico '
                        '(citas o consultas) asociado. Puedes desactivarlo en su lugar.'
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
