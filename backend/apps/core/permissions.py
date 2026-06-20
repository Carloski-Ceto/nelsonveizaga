"""
apps/core/permissions.py
Permisos DRF basados en tipo_usuario del CustomUser.
"""
from rest_framework.permissions import BasePermission
from rest_framework.permissions import SAFE_METHODS


class IsAdmin(BasePermission):
    """Sólo el tipo ADMIN del sistema."""
    message = 'Acceso exclusivo para administradores.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario == 'ADMIN'
        )


class IsAdministrativoOrAdmin(BasePermission):
    """ADMIN o personal ADMINISTRATIVO (recepción, etc.)."""
    message = 'Acceso restringido a personal administrativo.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO')
        )


class IsMedicoOrAdmin(BasePermission):
    """ADMIN, MEDICO o ESPECIALISTA."""
    message = 'Acceso restringido a médicos y especialistas.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario in ('ADMIN', 'MEDICO', 'ESPECIALISTA')
        )


class IsStaffOrReadOnly(BasePermission):
    """Lectura pública; escritura sólo para staff."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user and request.user.is_staff


class IsAdministrativoOrAdminWriteClinicoRead(BasePermission):
    """Lectura para perfiles clínicos; escritura solo ADMIN/ADMINISTRATIVO."""

    message = 'Acceso restringido: lectura clínica permitida, escritura solo administrativa.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA')
        return request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO')


class IsAdministrativoOrAdminCreateMedicoReadClinico(BasePermission):
    """Lectura clínica; create para ADMIN/ADMINISTRATIVO/MEDICO; resto de escritura solo administrativa."""

    message = 'Acceso restringido: lectura clínica, creación para médico, edición/eliminación administrativa.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA')
        if request.method == 'POST':
            return request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO', 'MEDICO')
        return request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO')
