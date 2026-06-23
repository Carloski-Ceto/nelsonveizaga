from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsEspecialistaOrAdminCreateClinicalRead(BasePermission):
    """Lectura clínica general; emisión/edición para ESPECIALISTA o ADMIN."""

    message = 'Solo un médico especialista o un administrador puede emitir recetas ópticas.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.tipo_usuario in (
                'ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA'
            )
        if request.method in ('POST', 'PUT', 'PATCH'):
            return request.user.tipo_usuario in ('ADMIN', 'ESPECIALISTA')

        # DELETE no está registrado: una receta puede corregirse, pero no eliminarse.
        return True
