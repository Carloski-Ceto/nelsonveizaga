from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import ConsultaMedica
from .serializers import ConsultaMedicaSerializer


class ConsultaMedicaViewSet(viewsets.ModelViewSet):
    queryset = ConsultaMedica.objects.select_related(
        'id_cita', 'id_paciente', 'id_especialista', 'registrado_por'
    ).all()
    serializer_class = ConsultaMedicaSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_paciente', 'id_especialista']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def perform_create(self, serializer):
        consulta = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='consultas',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró consulta médica {consulta.id_consulta}',
            tabla_afectada='consultas_medicas',
            id_registro_afectado=consulta.id_consulta,
            ip_origen=get_client_ip(self.request),
        )
