from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import RecetaOptica
from .permissions import IsEspecialistaOrAdminCreateClinicalRead
from .serializers import RecetaOpticaSerializer


class RecetaOpticaViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = RecetaOpticaSerializer
    permission_classes = [IsAuthenticated, IsEspecialistaOrAdminCreateClinicalRead]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_consulta', 'tipo', 'registrado_por']
    ordering_fields = ['fecha_emision']
    ordering = ['-fecha_emision']

    def get_queryset(self):
        return (
            RecetaOptica.objects.filter(id_historial_id=self.kwargs.get('historial_id'))
            .select_related('id_historial', 'id_consulta', 'registrado_por')
            .prefetch_related('detalles')
        )

    def perform_create(self, serializer):
        receta = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='recetas_opticas',
            accion=AccionBitacora.CREAR,
            descripcion=(
                f'Emitió receta óptica #{receta.id_receta_optica} para la consulta '
                f'#{receta.id_consulta_id} y el historial #{receta.id_historial_id}'
            ),
            tabla_afectada='recetas_opticas',
            id_registro_afectado=receta.id_receta_optica,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        receta = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='recetas_opticas',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'Editó receta óptica #{receta.id_receta_optica} de la consulta '
                f'#{receta.id_consulta_id} y el historial #{receta.id_historial_id}'
            ),
            tabla_afectada='recetas_opticas',
            id_registro_afectado=receta.id_receta_optica,
            ip_origen=get_client_ip(self.request),
        )
