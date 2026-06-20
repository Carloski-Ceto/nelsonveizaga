from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdmin, IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Rol, RolPermiso, UsuarioRol
from .serializers import RolPermisoSerializer, RolSerializer, UsuarioRolSerializer


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.prefetch_related('rol_permisos__id_permiso').all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'activo']
    ordering = ['nombre']

    def perform_create(self, serializer):
        rol = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.CREAR,
            descripcion=f'Creó rol: {rol.nombre}',
            tabla_afectada='roles', id_registro_afectado=rol.pk,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        rol = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.EDITAR,
            descripcion=f'Editó rol: {rol.nombre}',
            tabla_afectada='roles', id_registro_afectado=rol.pk,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        rid, nombre = instance.pk, instance.nombre
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó rol: {nombre}',
            tabla_afectada='roles', id_registro_afectado=rid,
            ip_origen=get_client_ip(self.request),
        )
        instance.delete()

    @action(detail=True, methods=['get', 'post'], url_path='permisos')
    def permisos(self, request, pk=None):
        rol = self.get_object()
        if request.method == 'GET':
            asignaciones = RolPermiso.objects.filter(id_rol=rol).select_related('id_permiso')
            return Response(RolPermisoSerializer(asignaciones, many=True).data)

        serializer = RolPermisoSerializer(data={**request.data, 'id_rol': rol.pk})
        serializer.is_valid(raise_exception=True)
        rp = serializer.save()
        permiso = rp.id_permiso
        registrar_bitacora(
            usuario=request.user, modulo='roles', accion=AccionBitacora.CREAR,
            descripcion=f'Asignó permiso {permiso.codigo} al rol {rol.nombre}',
            tabla_afectada='rol_permiso',
            id_registro_afectado=rp.pk,
            ip_origen=get_client_ip(request),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'permisos/(?P<permiso_pk>[0-9]+)')
    def quitar_permiso(self, request, pk=None, permiso_pk=None):
        rol = self.get_object()
        qs = RolPermiso.objects.filter(id_rol=rol, id_permiso_id=permiso_pk).select_related('id_permiso')
        obj = qs.first()
        if not obj:
            return Response({'error': 'Asignación no encontrada.'}, status=404)
        pcod = obj.id_permiso.codigo
        rid = obj.pk
        qs.delete()
        registrar_bitacora(
            usuario=request.user, modulo='roles', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Quitó permiso {pcod} del rol {rol.nombre}',
            tabla_afectada='rol_permiso', id_registro_afectado=rid,
            ip_origen=get_client_ip(request),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class UsuarioRolViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = UsuarioRol.objects.select_related('id_usuario', 'id_rol').all()
    serializer_class = UsuarioRolSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def perform_create(self, serializer):
        ur = serializer.save()
        u, r = ur.id_usuario, ur.id_rol
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.CREAR,
            descripcion=f'Asignó rol "{r.nombre}" a usuario {u.username}',
            tabla_afectada='usuario_rol', id_registro_afectado=ur.pk,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        u, r = instance.id_usuario, instance.id_rol
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Quitó rol "{r.nombre}" a usuario {u.username}',
            tabla_afectada='usuario_rol', id_registro_afectado=instance.pk,
            ip_origen=get_client_ip(self.request),
        )
        instance.delete()
