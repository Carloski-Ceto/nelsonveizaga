"""
apps/users/views.py
CRUD y acciones de administración sobre cuentas de usuario.

Autenticación (login, logout, JWT, recuperación de contraseña) → apps.auth
Roles → apps/roles/views.py
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import TipoUsuario, Usuario
from .serializers import UsuarioCreateSerializer, UsuarioSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de usuarios.
    GET/POST    /api/users/
    GET/PUT/PATCH/DELETE /api/users/{id}/
    POST        /api/users/{id}/activar/
    POST        /api/users/{id}/bloquear/
    GET/POST    /api/users/{id}/roles/
    """
    queryset = Usuario.objects.all().order_by('apellidos', 'nombres')
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def get_serializer_class(self):
        return UsuarioCreateSerializer if self.action == 'create' else UsuarioSerializer

    def perform_create(self, serializer):
        usuario = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='users', accion=AccionBitacora.CREAR,
            descripcion=f'Creó usuario: {usuario.username}',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        usuario = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='users', accion=AccionBitacora.EDITAR,
            descripcion=f'Editó usuario: {usuario.username}',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        registrar_bitacora(
            usuario=self.request.user, modulo='users', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó usuario: {instance.username}',
            tabla_afectada='usuarios', id_registro_afectado=instance.id,
            ip_origen=get_client_ip(self.request),
        )
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response(
                {'error': 'No puedes eliminar tu propia cuenta.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if (
            instance.tipo_usuario == TipoUsuario.ADMIN
            and request.user.tipo_usuario != TipoUsuario.ADMIN
        ):
            return Response(
                {
                    'error': (
                        'Solo un administrador del sistema puede eliminar cuentas '
                        'de tipo Admin del sistema.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """POST /api/users/{id}/activar/"""
        usuario = self.get_object()
        usuario.estado = 'ACTIVO'
        usuario.is_active = True
        usuario.save(update_fields=['estado', 'is_active'])
        registrar_bitacora(
            usuario=request.user, modulo='users', accion=AccionBitacora.EDITAR,
            descripcion=f'Activó usuario: {usuario.username}',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': f'Usuario {usuario.username} activado.'})

    @action(detail=True, methods=['post'])
    def bloquear(self, request, pk=None):
        """POST /api/users/{id}/bloquear/"""
        usuario = self.get_object()
        if usuario.pk == request.user.pk:
            return Response(
                {'error': 'No puedes bloquear tu propia cuenta.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        usuario.estado = 'BLOQUEADO'
        usuario.is_active = False
        usuario.save(update_fields=['estado', 'is_active'])
        registrar_bitacora(
            usuario=request.user, modulo='users', accion=AccionBitacora.EDITAR,
            descripcion=f'Bloqueó usuario: {usuario.username}',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': f'Usuario {usuario.username} bloqueado.'})

    @action(detail=True, methods=['get', 'post'], url_path='roles')
    def roles(self, request, pk=None):
        """
        GET  /api/users/{id}/roles/
        POST /api/users/{id}/roles/  Body: { "id_rol": <id> }
        """
        from apps.Usuarios.roles.models import UsuarioRol
        from apps.Usuarios.roles.serializers import UsuarioRolSerializer

        usuario = self.get_object()
        if request.method == 'GET':
            asignaciones = UsuarioRol.objects.filter(
                id_usuario=usuario
            ).select_related('id_rol')
            return Response(UsuarioRolSerializer(asignaciones, many=True).data)

        data = {**request.data, 'id_usuario': usuario.pk}
        serializer = UsuarioRolSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        ur = serializer.save()
        rol_nombre = ur.id_rol.nombre
        registrar_bitacora(
            usuario=request.user, modulo='users', accion=AccionBitacora.CREAR,
            descripcion=f'Asignó rol "{rol_nombre}" a usuario {usuario.username}',
            tabla_afectada='usuario_rol', id_registro_afectado=ur.pk,
            ip_origen=get_client_ip(request),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
