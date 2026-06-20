"""
apps/HistorialClinico/historial/views.py
ViewSet para CU20 Archivar historial clínico.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdminWriteAdministrativoRead
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import HistorialClinico
from .serializers import (
    HistorialArchivarSerializer,
    HistorialClinicoSerializer,
    HistorialRestaurarSerializer,
)


class HistorialClinicoViewSet(viewsets.ModelViewSet):
    queryset = HistorialClinico.objects.select_related(
        'id_paciente', 'archivado_por', 'registrado_por'
    ).all()
    serializer_class = HistorialClinicoSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdminWriteAdministrativoRead]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['id_paciente', 'estado']
    search_fields = ['id_paciente__nombres', 'id_paciente__apellidos']
    ordering_fields = ['fecha_creacion', 'fecha_archivo', 'estado']
    ordering = ['-fecha_creacion']

    def perform_create(self, serializer):
        historial = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='historial_clinico',
            accion=AccionBitacora.CREAR,
            descripcion=f'Creó historial clínico {historial.id_historial}',
            tabla_afectada='historiales_clinicos',
            id_registro_afectado=historial.id_historial,
            ip_origen=get_client_ip(self.request),
        )

    @action(detail=True, methods=['post'])
    def archivar(self, request, pk=None):
        historial = self.get_object()
        serializer = HistorialArchivarSerializer(
            data=request.data,
            context={'historial': historial, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        historial = serializer.save()
        registrar_bitacora(
            usuario=request.user,
            modulo='historial_clinico',
            accion=AccionBitacora.ARCHIVAR,
            descripcion=f'Archivó historial clínico {historial.id_historial}',
            tabla_afectada='historiales_clinicos',
            id_registro_afectado=historial.id_historial,
            ip_origen=get_client_ip(request),
        )
        return Response(HistorialClinicoSerializer(historial).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restaurar(self, request, pk=None):
        historial = self.get_object()
        serializer = HistorialRestaurarSerializer(
            data=request.data,
            context={'historial': historial, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        historial = serializer.save()
        registrar_bitacora(
            usuario=request.user,
            modulo='historial_clinico',
            accion=AccionBitacora.RESTAURAR,
            descripcion=f'Restauró historial clínico {historial.id_historial}',
            tabla_afectada='historiales_clinicos',
            id_registro_afectado=historial.id_historial,
            ip_origen=get_client_ip(request),
        )
        return Response(HistorialClinicoSerializer(historial).data, status=status.HTTP_200_OK)
