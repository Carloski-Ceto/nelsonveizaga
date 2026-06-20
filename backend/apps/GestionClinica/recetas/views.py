from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdminWriteAdministrativoRead
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import RecetaMedicamento
from .serializers import RecetaMedicamentoSerializer


class RecetaMedicamentoViewSet(viewsets.ModelViewSet):
    serializer_class = RecetaMedicamentoSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdminWriteAdministrativoRead]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_consulta', 'registrado_por']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        historial_id = self.kwargs.get('historial_id')
        return RecetaMedicamento.objects.filter(id_historial_id=historial_id).select_related(
            'id_historial', 'id_consulta', 'registrado_por'
        )

    def perform_create(self, serializer):
        receta = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='recetas',
            accion=AccionBitacora.CREAR,
            descripcion=f'Emitió receta médica #{receta.id_receta} para el historial clínico #{receta.id_historial_id}',
            tabla_afectada='recetas_medicamentos',
            id_registro_afectado=receta.id_receta,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        receta = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='recetas',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó receta médica #{receta.id_receta} del historial clínico #{receta.id_historial_id}',
            tabla_afectada='recetas_medicamentos',
            id_registro_afectado=receta.id_receta,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        id_receta = instance.id_receta
        id_historial = instance.id_historial_id
        instance.delete()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='recetas',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó receta médica #{id_receta} del historial clínico #{id_historial}',
            tabla_afectada='recetas_medicamentos',
            id_registro_afectado=id_receta,
            ip_origen=get_client_ip(self.request),
        )
