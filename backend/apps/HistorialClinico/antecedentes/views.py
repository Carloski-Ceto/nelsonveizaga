from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdminWriteAdministrativoRead
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import AntecedentePaciente
from .serializers import AntecedentePacienteSerializer


class AntecedentePacienteViewSet(viewsets.ModelViewSet):
    serializer_class = AntecedentePacienteSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdminWriteAdministrativoRead]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tipo_antecedente']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        historial_id = self.kwargs.get('historial_id')
        return AntecedentePaciente.objects.filter(id_historial_id=historial_id).select_related(
            'id_historial', 'registrado_por'
        )

    def perform_create(self, serializer):
        antecedente = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='antecedentes',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró antecedente {antecedente.id_antecedente} (tipo: {antecedente.tipo_antecedente}) para el historial clínico {antecedente.id_historial_id}',
            tabla_afectada='antecedentes_paciente',
            id_registro_afectado=antecedente.id_antecedente,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        antecedente = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='antecedentes',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó antecedente {antecedente.id_antecedente} para el historial clínico {antecedente.id_historial_id}',
            tabla_afectada='antecedentes_paciente',
            id_registro_afectado=antecedente.id_antecedente,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        id_antecedente = instance.id_antecedente
        id_historial = instance.id_historial_id
        instance.delete()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='antecedentes',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó antecedente {id_antecedente} del historial clínico {id_historial}',
            tabla_afectada='antecedentes_paciente',
            id_registro_afectado=id_antecedente,
            ip_origen=get_client_ip(self.request),
        )
