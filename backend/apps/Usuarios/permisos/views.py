"""
apps/permisos/views.py

Endpoints:
  GET/POST       /api/v1/permisos/
  GET/PUT/PATCH  /api/v1/permisos/{id}/
  DELETE         /api/v1/permisos/{id}/
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Permiso
from .serializers import PermisoSerializer


class PermisoViewSet(viewsets.ModelViewSet):
    """
    CRUD de permisos del sistema. Solo accesible por ADMIN.
    Los permisos definen acciones granulares por módulo.
    """
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['modulo']
    search_fields = ['codigo', 'nombre', 'modulo', 'descripcion']
    ordering_fields = ['modulo', 'codigo', 'nombre']
    ordering = ['modulo', 'codigo']

    def perform_create(self, serializer):
        p = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='permisos', accion=AccionBitacora.CREAR,
            descripcion=f'Creó permiso: {p.codigo}',
            tabla_afectada='permisos', id_registro_afectado=p.pk,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        p = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='permisos', accion=AccionBitacora.EDITAR,
            descripcion=f'Editó permiso: {p.codigo}',
            tabla_afectada='permisos', id_registro_afectado=p.pk,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        pid, codigo = instance.pk, instance.codigo
        registrar_bitacora(
            usuario=self.request.user, modulo='permisos', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó permiso: {codigo}',
            tabla_afectada='permisos', id_registro_afectado=pid,
            ip_origen=get_client_ip(self.request),
        )
        instance.delete()
