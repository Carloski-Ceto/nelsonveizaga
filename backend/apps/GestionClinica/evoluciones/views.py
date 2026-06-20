from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdminWriteAdministrativoRead
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import EvolucionPaciente
from .serializers import EvolucionPacienteSerializer


class EvolucionPacienteViewSet(viewsets.ModelViewSet):
    serializer_class = EvolucionPacienteSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdminWriteAdministrativoRead]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_especialista']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        historial_id = self.kwargs.get('historial_id')
        return EvolucionPaciente.objects.filter(id_historial_id=historial_id).select_related(
            'id_historial', 'id_especialista', 'registrado_por'
        )

    def perform_create(self, serializer):
        evolucion = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='evoluciones',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró evolución {evolucion.id_evolucion} para el historial clínico {evolucion.id_historial_id}',
            tabla_afectada='evoluciones_paciente',
            id_registro_afectado=evolucion.id_evolucion,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        evolucion = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='evoluciones',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó evolución {evolucion.id_evolucion} para el historial clínico {evolucion.id_historial_id}',
            tabla_afectada='evoluciones_paciente',
            id_registro_afectado=evolucion.id_evolucion,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        id_evolucion = instance.id_evolucion
        id_historial = instance.id_historial_id
        instance.delete()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='evoluciones',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó evolución {id_evolucion} del historial clínico {id_historial}',
            tabla_afectada='evoluciones_paciente',
            id_registro_afectado=id_evolucion,
            ip_origen=get_client_ip(self.request),
        )
