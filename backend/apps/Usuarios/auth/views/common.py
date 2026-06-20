"""Utilidades compartidas entre vistas de autenticación."""
from rest_framework_simplejwt.tokens import RefreshToken

from apps.Usuarios.users.serializers import UsuarioSerializer


def jwt_login_response(usuario):
    """Genera respuesta estándar con tokens JWT + datos del usuario."""
    refresh = RefreshToken.for_user(usuario)
    return {
        'usuario': UsuarioSerializer(usuario).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def errors_mean_bad_credentials_only(errors, bad_msg: str) -> bool:
    """True si el único fallo es credenciales incorrectas (cuenta para bloqueo temporal)."""
    login_err = errors.get('login')
    if not login_err:
        return False
    first = login_err[0] if isinstance(login_err, (list, tuple)) else login_err
    if str(first) != bad_msg:
        return False
    return len(errors) == 1
