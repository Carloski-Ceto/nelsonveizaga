"""
Códigos de recuperación de contraseña (un solo uso, vigencia vía settings).
"""
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.Usuarios.users.models import Usuario

from .models import TokenRecuperacion


def _code_length():
    n = int(getattr(settings, 'PASSWORD_RESET_CODE_LENGTH', 6) or 6)
    return max(4, min(n, 12))


def generar_codigo_recuperacion():
    """Código numérico con ancho fijo (p. ej. 6 dígitos)."""
    length = _code_length()
    upper = 10**length
    return f'{secrets.randbelow(upper):0{length}d}'


def crear_token_recuperacion(usuario):
    """
    Invalida códigos anteriores activos del usuario y crea uno nuevo.
    Retorna el objeto TokenRecuperacion creado (campo `token` = código mostrado al usuario).
    """
    TokenRecuperacion.objects.filter(id_usuario=usuario, usado=False).update(usado=True)
    ttl = int(getattr(settings, 'PASSWORD_RESET_CODE_TTL_SECONDS', 180) or 180)
    ttl = max(10, min(ttl, 3600))
    expira_en = timezone.now() + timedelta(seconds=ttl)
    return TokenRecuperacion.objects.create(
        id_usuario=usuario,
        token=generar_codigo_recuperacion(),
        expira_en=expira_en,
    )


def normalizar_codigo_ingresado(codigo_raw):
    """Solo dígitos; el usuario puede pegar espacios o guiones."""
    if codigo_raw is None:
        return ''
    return ''.join(c for c in str(codigo_raw).strip() if c.isdigit())


def buscar_token_recuperacion_valido(email, codigo_raw):
    """
    Busca código activo para el correo indicado.
    Retorna (TokenRecuperacion, None) si válido.
    Retorna (None, 'expired' | 'invalid').
    """
    codigo = normalizar_codigo_ingresado(codigo_raw)
    length = _code_length()
    if len(codigo) != length:
        return None, 'invalid'

    try:
        usuario = Usuario.objects.get(email__iexact=email.strip())
    except Usuario.DoesNotExist:
        return None, 'invalid'

    if usuario.estado != 'ACTIVO':
        return None, 'invalid'

    try:
        token = TokenRecuperacion.objects.select_related('id_usuario').get(
            id_usuario=usuario,
            token=codigo,
            usado=False,
        )
    except TokenRecuperacion.DoesNotExist:
        return None, 'invalid'

    if token.expira_en < timezone.now():
        return None, 'expired'

    return token, None
