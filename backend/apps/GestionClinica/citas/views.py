from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import (
    IsAdministrativoOrAdmin,
    IsAdministrativoOrAdminCreateMedicoReadClinico,
    IsAdministrativoOrAdminWriteClinicoRead,
    IsMedicoOrAdmin,
)
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Cita, HorarioEspecialista
from .serializers import (
    CitaCancelarSerializer,
    CitaReprogramarSerializer,
    CitaSerializer,
    HorarioEspecialistaSerializer,
)


class HorarioEspecialistaViewSet(viewsets.ModelViewSet):
    queryset = HorarioEspecialista.objects.select_related('id_especialista').all()
    serializer_class = HorarioEspecialistaSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdminWriteClinicoRead]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_especialista', 'dia_semana', 'activo']
    ordering_fields = ['dia_semana', 'hora_inicio']
    ordering = ['id_especialista', 'dia_semana', 'hora_inicio']

    def perform_create(self, serializer):
        horario = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='citas',
            accion=AccionBitacora.CREAR,
            descripcion=f'Creó horario especialista {horario.id_especialista_id}',
            tabla_afectada='horarios_especialista',
            id_registro_afectado=horario.id_horario,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        horario = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='citas',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó horario especialista {horario.id_especialista_id}',
            tabla_afectada='horarios_especialista',
            id_registro_afectado=horario.id_horario,
            ip_origen=get_client_ip(self.request),
        )


class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.select_related('id_paciente', 'id_especialista', 'registrado_por').all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdminCreateMedicoReadClinico]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['id_especialista', 'id_paciente', 'estado']
    search_fields = ['id_paciente__nombres', 'id_paciente__apellidos', 'motivo']
    ordering_fields = ['fecha_hora_inicio', 'estado', 'fecha_creacion']
    ordering = ['-fecha_hora_inicio']

    def perform_create(self, serializer):
        cita = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='citas',
            accion=AccionBitacora.CREAR,
            descripcion=f'Programó cita {cita.id_cita}',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(self.request),
        )

    @action(detail=True, methods=['post'])
    def reprogramar(self, request, pk=None):
        cita = self.get_object()
        serializer = CitaReprogramarSerializer(data=request.data, context={'cita': cita})
        serializer.is_valid(raise_exception=True)
        cita = serializer.save()
        registrar_bitacora(
            usuario=request.user,
            modulo='citas',
            accion=AccionBitacora.REPROGRAMAR,
            descripcion=f'Reprogramó cita {cita.id_cita}',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(request),
        )
        return Response(CitaSerializer(cita).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        cita = self.get_object()
        serializer = CitaCancelarSerializer(data=request.data, context={'cita': cita})
        serializer.is_valid(raise_exception=True)
        cita = serializer.save()
        registrar_bitacora(
            usuario=request.user,
            modulo='citas',
            accion=AccionBitacora.CANCELAR,
            descripcion=f'Canceló cita {cita.id_cita}',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(request),
        )
        return Response(CitaSerializer(cita).data, status=status.HTTP_200_OK)


class AgendaMedicaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cita.objects.select_related('id_paciente', 'id_especialista', 'registrado_por').all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_especialista', 'estado']
    ordering_fields = ['fecha_hora_inicio']
    ordering = ['fecha_hora_inicio']
